

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , bus = require('../app/bus')
  , format=require('./lib/order.format')
  , utils=require('./lib/order.utils')
  , stats=require('./lib/order.stats')
  , finds=require('./lib/order.finds')
  , core=require('./lib/order.core')
  , cache = require("lru-cache")({maxAge:1000 * 60 * 60 * 24,max:50})
  , payment = require('../app/payment')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , errorHelper = require('mongoose-error-helper').errorHelper;


//
// multiple connection
if(config.mongo.multiple){
  mongoose=mongoose.createConnection(config.mongo.multiple);
  console.log('multiple',config.mongo.multiple)
}

//
// managing geospatial with mongo
// http://blog.nodeknockout.com/post/35215504793/the-wonderful-world-of-geospatial-indexes-in-mongodb
//  Db.connect("mongodb://localhost:27017/geodb", function(err, db) {
//    if(err) return console.dir(err)
//
//    db.collection('places').geoNear(50, 50, {$maxDistance:10}, function(err, result) {
//      if(err) return console.dir(err)
//
//      assert.equal(result.results, 2);
//    });
//  });

// Orders Model
var EnumOrderStatus    =config.shared.order.status;
var EnumCancelReason   =config.shared.order.cancelreason;
var EnumFinancialStatus=config.shared.order.financialstatus;
var EnumOrderMethod   =_.map(config.shared.order.gateway,
                            function(e){return e.label});
var EnumShippingMode   =config.shared.order.shippingmode;

var Orders = new Schema({
   /** order identifier */
   oid: { type: Number, required: true, unique:true },

   /* compute a rank for the set of orders to be shipped together */
   rank:{type:Number,default:0},

   /* customer email */
   email:{type: String, required:true},
   created:{type: Date, default: Date.now },
   closed:{type: Date},

   /* full customer details */
   customer:{type: Schema.Types.Mixed, required:true},

   /* order canceled reason and dates */
   cancel:{
      reason:{type:String, enum:EnumCancelReason},
      when:{type: Date}
   },

   /* discount_code:{type: String}, */
   /* cart_token:{type: String}, */

   payment:{
      alias: {type:String, required:true},
      number:{type:String, required:false},
      expiry:{type:String, required:false},
      issuer:{type:String,enum: EnumOrderMethod, required:true},
      status:{type:String, enum:EnumFinancialStatus, default:'pending'},
      handle:{type:String,default:config.admin.handle},
      provider:{type:String,default:config.payment.provider},
      logs:[String],
      fees:{
        charge:Number,
        shipping:{type:Number}
      },
      correction:{
        amount:Number,
        transaction:{type:String,select:false}
      },
      /*for security reason transaction data are encrypted */
      transaction:{type:String,select:false}
   },


   fulfillments:{
     status:{type: String, required: true, enum: EnumOrderStatus, default:'created'},
   },

   items:[{
      sku:{type:Number, min:10000, requiered:true},
      title:{type:String, required:true},
      category:{type:String, required:true},

      // customer quantity
      quantity:{type:Number, min:1, max:100, requiered:true},
      // given price
      price:{type:Number, min:0, max:2000, requiered:true},
      part:{type: String, required: true},

      // real price, maximum +/- 10% of given price
      finalprice:{type:Number, min:0, max:1000, requiered:true},

      // customer note
      note:{type:String, required:false},

      //
      // product variation is not yet implemented
      variant:{
        id:{type:String, required:false},
        title:{type:String, required:false}
      },

      /* where is the product now? */
      fulfillment:{
        status:{type: String, required: true, enum: EnumOrderStatus, default:'created'},
        note:{type: String, required: false},
        shipping:{type:String,enum:EnumShippingMode, required:true, default:'grouped'}
      },

      vendor:{type:String, required:true}

      //
      // only displayed for owner and admin
      // fees:{type:Number,select:false, requiered:true}
   }],

   vendors:[{
    ref:{type: Schema.Types.ObjectId, ref : 'Shops', requiered:true},
    //
    // only displayed for owner and admin
    fees:{type:Number,select:false, requiered:true},
    slug:{type:String, required:true},
    name:{type:String, required:true},
    fullName:{type:String, required:false},
    address:{type:String, required:true},
    address2:{type:String},
    geo:{
      lat:{type:Number, required: false},
      lng:{type:Number, required: false}
    },
    collected:{type:Boolean,default:false}
   }],

   shipping:{
      when:{type:Date, required:true},
      hours:{type:Number, required:false},
      name:{type:String, required:true},
      note:{type:String},
      streetAdress:{type:String,required:true},
      floor:{type:String, required:true},
      postalCode:{type:String, required:true},
      region:{type:String, required:true},
      geo:{ // geo is not mandatory
        lat:{type:Number, required: false},
        lng:{type:Number, required: false}
      },
      shipped:{type:Boolean,default:false},
      bags:{type:Number}
   }


});


//
// import utils API
Orders.methods.print=function(order){
  mongoose.model('Orders').print(this)
}
Orders.statics.print=utils.print;
Orders.statics.printInfo=utils.printInfo;
Orders.statics.prepare=utils.prepare;
Orders.methods.equalItem=utils.equalItem;
Orders.methods.getShippingPrice=utils.getShippingPrice;
Orders.methods.getTotalPrice=utils.getTotalPrice;
Orders.methods.getSubTotal=utils.getSubTotal;
Orders.methods.getDateString=utils.getDateString;
Orders.statics.formatDate=utils.formatDate;
Orders.statics.findCurrentShippingDay=utils.findCurrentShippingDay;
Orders.statics.findNextShippingDay=utils.findNextShippingDay;
Orders.statics.findOneWeekOfShippingDay=utils.findOneWeekOfShippingDay;
Orders.statics.jumpToNextWeekDay=utils.jumpToNextWeekDay;
Orders.statics.groupByShop=utils.groupByShop;
Orders.statics.collectVendorsSlug=utils.collectVendorsSlug;
Orders.statics.findOneVendorFromSlug=utils.findOneVendorFromSlug;
Orders.statics.filterByShop=utils.filterByShop;
Orders.statics.sortByDateAndUser=utils.sortByDateAndUser;

//
// import find API
Orders.statics.findByTimeoutAndNotPaid=finds.findByTimeoutAndNotPaid;
Orders.statics.findByCriteria=finds.findByCriteria;

//
// import manage API
Orders.statics.validateParams = core.validateParams;
Orders.statics.updateItem = core.updateItem;
Orders.statics.updateLogistic =core.updateLogistic;
Orders.statics.coreCreate =core.coreCreate;
Orders.methods.computeRankAndSave=core.computeRankAndSave;

//
// import format API
Orders.statics.prepareOrdersForMail=format.prepareOrdersForMail;
Orders.statics.convertOrdersToRepportForShop=format.convertOrdersToRepportForShop;

//
// import stats API
Orders.statics.getStatsByOrder=stats.getStatsByOrder;
Orders.statics.favoriteProductsVsUsers=stats.favoriteProductsVsUsers;
Orders.statics.getSellValueByYearAndWeek=stats.getSellValueByYearAndWeek;
Orders.statics.getCAByYearMonthAndVendor=stats.getCAByYearMonthAndVendor;
Orders.statics.ordersByPostalVsUsersByPostal=stats.ordersByPostalVsUsersByPostal;
Orders.statics.ordersByUsers=stats.ordersByUsers;


//
// check item
//  if item or product are !Nill
//  if item.category is !Nill
//  if item.vendor is !Nill and vendor==product.ID
//  if product is available
//  if item.quantity>product.pricing.stock
//  if item price is still correct
Orders.statics.checkItem=function(shipping, item, product, cb){
  var msg1="Une erreur c'est produite avec cet article (1)"
    , msg2="Ce produit n'est plus disponible "
    , msg3="Le prix de votre produit a été modifié par le vendeur "
    , msg31="Une erreur c'est produite avec cet article (2)"
    , msg32="Une erreur c'est produite avec cet article (3)"
    , msg4="La quantité d'achat minimum est de 1 "
    , msg5="Ce produit n'est pas disponible car la boutique a été désactivée"
    , msg6="Ce produit n'est pas disponible car la boutique sera fermée ce jour là"
    , msg7="La quantité souhaitée n'est pas disponible "
    , msg8="Ce produit n'est plus en stock "
    , msg9="Ce jour de livraison n'est pas disponible pour la boutique "
    , msg10="La variation de ce produit n'est plus disponible "
    , msg11="Vous n'avez pas sélectionné une des options liée à ce produit. Merci de l'enlever de votre panier!"


  assert(item.sku==product.sku)


  var vendor={};

  //
  // check item and product exists
  if(!item || !product || item.sku!==product.sku){
    return cb(msg1,item)
  }

  //
  // add item.categories
  if(!item.category){
    item.category=product.categories.name
  }


  //
  // check item.vendor
  if(!item.vendor ){
    return cb(msg1,item)
  }

  if(!product.vendor||product.vendor.status!==true){
    return cb(msg5,item)
  }

  //
  // check that vendor is open for the date: shipping.when
  if(product.vendor.available&&product.vendor.available.active===true){
    // if one of the date doesn't exist, we force the store to be closed
    var forceClosed=!product.vendor.available.from||!product.vendor.available.to;
    var from = new Date(product.vendor.available.from);
    var to=new Date(product.vendor.available.to);
    from.setHours(1,0,0,0);
    to.setHours(1,0,0,0);
    // console.log('TESTING',shipping.when.toLocaleString(),from.toLocaleString(),to.toLocaleString())
    if((shipping.when>=from && shipping.when<=to) ||forceClosed){
      return cb(msg6,item)      
    }
  }

  //
  // check that vendor shipping day is available for: config.shared.order.weekdays

  if (product.vendor.available.weekdays&&product.vendor.available.weekdays.indexOf(shipping.when.getDay())==-1){
    return cb(msg9+product.vendor.name,item)
  }




  //
  // check that mapping between product and item is correct
  if(product.vendor._id.toString()!==item.vendor.toString()&&
     product.vendor.urlpath!==item.vendor &&
     product.vendor._id.toString()!==item.vendor._id.toString()){
    return cb(msg32,item)
  }
  item.vendor=product.vendor.urlpath;

  // default address
  var address=product.vendor.address.streetAdress+', '+product.vendor.address.postalCode+' tel:'+product.vendor.address.phone, 
      geo=product.vendor.address.geo,
      marketplace=false;

  // override address based on marketplace        
  if(product.vendor.marketplace.length){
    config.shared.marketplace.list.every(function(place){
      // check place with date
      if(place.d&&place.d===shipping.when.getDay()){
        address=place.name;
        geo={lat:place.lat,lng:place.lng}
        marketplace=true;
        return false;
      } 
      return true;
    })
  }

  // append repository if marketplace is defined
  if(marketplace && product.vendor.address.repository){
    address=address+', '+product.vendor.address.repository
  }
  // TODO, refactor the idea of repository! set respository as address
  // -> remove geo 
  else if(product.vendor.address.repository){
    address=product.vendor.address.repository;
    geo=undefined;
  }

  vendor={
      ref:product.vendor._id,
      slug:product.vendor.urlpath,
      name:product.vendor.name,
      address:address,
      fees:product.vendor.account.fees,
      geo:geo
  };

  //
  // duplicate fees to simplify repport
  item.fees=product.vendor.account.fees;

  //
  // check item is still available in stock
  if(!product.attributes.available){
    return cb(msg2,item)
  }

  //
  // check that variant is selected
  if(product.variants.length&&(!item.variant||!item.variant.title)){
    return cb(msg11,item);
  }
  //
  // check that variant exist
  if(item.variant&&item.variant.title){
    var find=product.variants.filter(function (variant) {
      return (item.variant.title!=null && 
              variant.title===item.variant.title)
    });
    if(!find.length){
      return cb(msg10,item)
    }
  }

  // check if item.quantity <1
  if(item.quantity<1){
    return cb(msg4,item)
  }

  //
  // check item is still available in stock
  if(product.pricing.stock==0){
    return cb(msg8,item)
  }

  debug("order: item.quantity>product.pricing.stock %d %d",item.quantity,product.pricing.stock)
  if(item.quantity>product.pricing.stock){
    return cb(msg7,item)
  }


  //
  // check item is correct
  // Math.round(value*100)/100
  // if product has discount, price should be computed with
  var price=product.getPrice();
  if(item.price.toFixed(1)!=price.toFixed(1)){
    return cb(msg3,item)
  }

  var finalprice=product.getPrice()*item.quantity;
  if(item.finalprice.toFixed(1)!=finalprice.toFixed(1)){
    return cb(msg31,item)
  }


  return cb(null,item,vendor);
};

//
// check items a new order
Orders.statics.checkItems = function(shipping, items, products, callback){
  assert(items);
  assert(products);
  assert(callback);
  var db=this
    , Orders=db.model('Orders');


  var vendors=[], errors=[], product;
  for (var i = 0; i <items.length; i++) {
    // get product by sku
    product=_.findWhere(products,{sku:items[i].sku});
    //
    // check an item
    Orders.checkItem(shipping, items[i],product,function(err,item, vendor){
      if(vendor)vendors.push(vendor);
      var error={}; error[item.sku]=err;
      //
      // collect error by product
      err&&errors.push(error);
    })
  };

  return callback(null,products,vendors, errors)
};

//
// status == created, payment == pending
Orders.methods.updateProductQuantityAndSave=function(callback){
  assert(callback)
  var Q=require('q'),deferred = Q.defer();

  var self=this, tasks=[];
  var msg1="Could not update product quantity for paid or partialy fulfilled order";


  if(this.fulfillments.status !=="created" || this.payment.status!=="pending"){
    callback(msg1)
  }
  this.items.forEach(function (item) {
    tasks.push((function(item) {
      //
      // rollback item quantity in stock
      debug("%d lock products quantity %s %s",self.oid, item.sku, -item.quantity)
      db.model('Products')
        .update({sku:item.sku},{$inc: {"pricing.stock":-item.quantity}}, { safe: true },function(err,result) {
          if(err){
            return deferred.reject(err);
          }
          deferred.resolve(result)
        })
      return deferred.promise;
      
    })(item))
  })

  return Q.all(tasks).then(function(result) {
    // we have to mention this state to avoid two times reservation
    self.fulfillments.status="reserved";

    //items are also in right state
    self.items.forEach(function(item,i){
      //initialise fulfillment
      item.fulfillment.status='reserved';
    })
    return self.save(callback)
  },function (err) {
      callback(err);
      // FIXME error in this place is an issue!!!
      throw new Error("rollback not implemented: "+(err.message||err));
  })
};

//
// status == reserved||fulfilled, payment==pending||refund||voided 
Orders.methods.rollbackProductQuantityAndClose=function(reason, callback){
  assert(callback)
  var Q=require('q'),deferred = Q.defer(), tasks=[];
  var self=this;


  if(EnumCancelReason.indexOf(reason)===-1){
    return callback("Le libéllé de l'annulation n'est pas valable : "+reason)
  }

  //
  // accepted payment status for rollback
  if(["refund",'voided'].indexOf(self.payment.status)===-1){
    return callback("Impossible d'effectué un rollback sur une commande avec le status: "+self.fulfillments.status);
  }

  //
  // accepted payment status for rollback
  if(["failure"].indexOf(self.fulfillments.status)===-1){
    return callback("Impossible d'effectué un rollback sur une commande avec le status: "+self.fulfillments.status);
  }

  this.items.forEach(function (item) {
    tasks.push((function(item) {
      debug("%d unlock products quantity %s %d",self.oid, item.sku, item.quantity)
      db.model('Products').update({sku:item.sku},{$inc: {"pricing.stock":item.quantity}}, { safe: true }, function (err,result) {
        if(err){return deferred.reject(err);}
        deferred.resolve(result)
      })
    })(item));
  })
  return Q.all(tasks).then(function(result) {


    //
    // status is canceled
    self.cancel={};
    self.cancel.reason=reason;
    self.cancel.when=new Date();
    self.closed=new Date();

    //
    // this checking generate a list of products
    return self.save(callback)
    // return callback(null,self);

  },function (err) {
    //
    //DANGER send email
    bus.emit('system.message',"[karibou-danger] rollback: ",{error:err,order:self.oid,customer:self.email});

    return callback(err);
  });
};


//
// create a new order
Orders.statics.create = function(items, customer, shipping, paymentData, callback){
  assert(items);
  assert(customer);
  assert(shipping);
  assert(callback);
  var db=this
    , Orders=this.model('Orders'), vendors=[], skus=[],products=[];


  //
  // check all parameters
  debug('validate params  %s on %s with %d items',shipping.name,shipping.when,items.length);
  this.validateParams(items,customer,shipping,paymentData)
  .then(function  (argument) {

    //
    // sort items by SKU (important to map them with products !)
    items=_.sortBy(items,function(i){return i.sku});

    //
    // get list of products
    skus=_.uniq(items.map(function(item){return item.sku}));
    products=[];

    return db.model('Products')
                .findBySkus(skus)
                .populate('vendor','+account.fees')
                .sort("sku").exec();
  })

  //
  // map items with local products
  .then(function (ps) {
    products=ps;
    if(skus.length!==products.length){
      return callback("Certains produits sélectionnés n'existent plus, vérifier votre panier");
    }

    //
    // chain OID creation
    return db.model('Sequences').nextOrder();
  })

  //
  // get unique Order identifier
  // and create order
  .then(function(oid){

    //
    // check products and vendors
    debug('check order %s products  %s on %s with %d items',oid,shipping.name,shipping.when,items.length);
    return Orders.checkItems(shipping, items,products,function(err, products,vs, errors){
      //
      // unknow issue?
      if(err){
        return callback(err)
      }

      //
      // items issue? return the lists of issues
      if((errors&&errors.length)){
        return callback(null,{errors:errors})
      }

      //
      // attache items/vendors when success,
      vendors=_.uniq(vs,false,function(e){return e.slug;});

      return Orders.coreCreate(oid, items,customer,shipping,paymentData,vendors);

    });

  })
  //
  // finally update stocks
  .then(function (order) {
    order.updateProductQuantityAndSave(callback);
  })

  //
  // catch all errors
  .then(undefined,function (err) {
    callback(errorHelper(err.message||err))
  });
};


//
// update cancel
// 1) from user => reason=customer
// status=created|reserved, payment=pending|authorized
// 2) from admin => reason=fraud|inventory|other(|timeout|system)
// status=created|reserved, payment=pending|authorized
// status=fulfilled, payment=authorized
// status=fulfilled, payment=paid

Orders.statics.onCancel = function(oid, reason, callback){
  assert(oid);

  //
  // check cancel reason
  if(EnumCancelReason.indexOf(reason)===-1){
    return callback("Le libéllé de l'annulation n'est pas valable : "+reason)
  }

  db.model('Orders').findOne({oid:oid}).select('+payment.transaction').exec(function(err,order){
    if(err){
      return callback(err)
    }
    if(!order){
      return callback("Impossible de trouver la commande: "+oid);
    }


    //
    // check order status
    if(order.closed){
      return callback("Impossible de modifier une commande fermée: "+oid);
    }

    // is already cancel
    if(order.cancel&&order.cancel.when){
      return callback("Impossible de modifier une commande annulée: "+oid);
    }


    // early test
    // make sure that payment issuer belongs to this customer
    if(!payment.for(order.payment.issuer).isValidAlias(order.payment.alias,order.customer, order.payment.issuer)){
      return callback("Votre méthode de paiement est invalide, l'action ne peut pas être passée")
    }


    // 
    // ==== customer cancel =====
    // 1) from user => reason=customer
    // status=created|reserved, payment=pending|authorized
    if(reason==='customer'){
    }

    //
    // TODO should be abel cancel fraud 
    payment.for(order.payment.issuer).cancel(order,reason)
      .then(function(transaction){
        bus.emit('order.cancel',order)
        //
        // TODO rollback items on cancel or delete
        return callback(null,order)
      })
      .fail(function(err){
        return callback(err.message||err,order)
      })

  });
}

Orders.statics.onRefund = function(oid, amount, callback){
  assert(oid);

  db.model('Orders').findOne({oid:oid}).select('+payment.transaction').exec(function(err,order){
    if(err){
      return callback(err)
    }
    if(!order){
      return callback("Impossible de trouver la commande: "+oid);
    }


    // early test
    // make sure that payment issuer belongs to this customer
    if(!payment.for(order.payment.issuer).isValidAlias(order.payment.alias,order.customer, order.payment.issuer)){
      return callback("Votre méthode de paiement est invalide, l'action ne peut pas être passée")
    }


    //
    // TODO should be abel cancel fraud 
    payment.for(order.payment.issuer).refund(order, amount)
      .then(function(transaction){
        bus.emit('order.refund',order)
        //
        // TODO rollback items on cancel or delete
        return callback(null,order)
      })
      .fail(function(err){
        return callback(err.message||err,order)
      })

  });
}




Orders.statics.generateRepportForShop=function(criteria,cb) {
  var Orders=this;

  //
  // force thoses fields
  criteria.fulfillment='fulfilled';
  criteria.closed=true;

  Orders.findByCriteria(criteria).select('+vendors.fees').sort("created").exec(function(err,orders){
    if(err){
      return cb(err);
    }

    //
    // filter only when needed
    if(criteria.shop){
      orders=Orders.filterByShop(orders,criteria.shop);
    }


    //
    // get shops details
    var slugs=Orders.collectVendorsSlug(orders)
    return db.model('Shops').findAllBySlug(slugs,function(err,shops) {
      cb(null,Orders.convertOrdersToRepportForShop(criteria.from, criteria.to, orders, shops,criteria.showAll))
    });


  });


};



Orders.set('autoIndex', config.mongo.ensureIndex);



exports.Orders = mongoose.model('Orders', Orders);
