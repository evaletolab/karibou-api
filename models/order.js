

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , bus = require('../app/bus')
  , format=require('./lib/order.format')
  , utils=require('./lib/order.utils')
  , payment = require('../app/payment')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId
  , errorHelper = require('mongoose-error-helper').errorHelper;



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
var EnumOrderStatus    =config.shop.order.status;
var EnumCancelReason   =config.shop.order.cancelreason;
var EnumFinancialStatus=config.shop.order.financialstatus;
var EnumOrderMethod   =_.map(config.shop.order.gateway,
                            function(e){return e.label});
var EnumShippingMode   =config.shop.order.shippingmode;

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
      issuer:{type:String,enum: EnumOrderMethod, required:true},
      status:{type:String, enum:EnumFinancialStatus, default:'pending'},
      handle:{type:String,default:config.admin.handle},
      provider:{type:String,default:config.payment.provider},
      logs:[String],
      fees:{
        charge:Number,
        shipping:{type:Number}
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
        name:{type:String, required:false}
      },

      /* where is the product now? */
      fulfillment:{
        status:{type: String, required: true, enum: EnumOrderStatus, default:'created'},
        note:{type: String, required: false},
        shipping:{type:String,enum:EnumShippingMode, required:true, default:'grouped'}
      },

      vendor:{type:String, required:true}
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
      shipped:{type:Boolean,default:false}
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
Orders.statics.getVendorsSlug=utils.getVendorsSlug;
Orders.statics.filterByShop=utils.filterByShop;

//
// import format API
Orders.statics.sortByDateAndUser=format.sortByDateAndUser;
Orders.statics.convertOrdersToRepportForShop=format.convertOrdersToRepportForShop;




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
    , msg4="La quantité d'achat minimum est de 1 "
    , msg5="Ce produit n'est pas disponible car la boutique a été désactivée"
    , msg6="Ce produit n'est pas disponible car la boutique sera fermée ce jour là"
    , msg7="La quantité souhaitée n'est pas disponible "
    , msg8="Ce produit n'est plus en stock "
    , msg9="Ce jour de livraison n'est pas disponible pour la boutique "


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
  // check that vendor shipping day is available for: config.shop.order.weekdays

  if (product.vendor.available.weekdays&&product.vendor.available.weekdays.indexOf(shipping.when.getDay())==-1){
    return cb(msg9+product.vendor.name,item)
  }



  if((typeof item.vendor) !=='object' ){
    assert(product.vendor._id.toString()===item.vendor.toString())
    item.vendor=product.vendor.urlpath;

    // default address
    var address=product.vendor.address.streetAdress+', '+product.vendor.address.postalCode+' tel:'+product.vendor.address.phone, 
        geo=product.vendor.address.geo,
        marketplace=false;

    // override address based on marketplace        
    if(product.vendor.marketplace.length){
      config.shop.marketplace.list.every(function(place){
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
    // set respository as address
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
  }

  //
  // check item is still available in stock
  if(!product.attributes.available){
    return cb(msg2,item)
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


  return cb(null,item,vendor)

  // mongoose.model('Products').findOneBySku(itecreatem.sku,function(err,product){
  // })

}

//
// check items a new order
Orders.statics.checkItems = function(shipping, items, callback){
  assert(items);
  assert(callback);
  var db=this
    , Orders=db.model('Orders')
    , Products=db.model('Products')

  items=_.sortBy(items,function(i){return i.sku});
  var skus=items.map(function(item){return item.sku});
  Products.findBySkus(skus).populate('vendor','+account.fees').sort("sku").exec(function(err,products){
    if(skus.length!==products.length){
      return callback("Certains produits sélectionnés n'existe pas, vérifier votre panier")
    }

    var vendors=[], errors=[];
    for (var i = 0; i <items.length; i++) {
      //
      // check an item
      Orders.checkItem(shipping, items[i],products[i],function(err,item, vendor){
        if(vendor)vendors.push(vendor);
        var error={}; error[item.sku]=err;
        //
        // collect error by product
        err&&errors.push(error)
      })
    };
    return callback(err,products,vendors, errors)
  });
}

Orders.methods.computeRankAndSave=function(cb){

  var self=this, sd=new Date(this.shipping.when), ed, promise, orderRank=1;
  sd.setHours(1,0,0,0)
  ed=new Date(sd.getTime()+86400000-3601000);

  db.model('Orders').find({"shipping.when":{"$gte": sd, "$lt": ed}}).exec(function(err,orders){
    var newRank=0;
    for (var i = orders.length - 1; i >= 0; i--) {
      newRank=Math.max(newRank,orders[i].rank);
    };
    self.rank=newRank+1;
    debug("computeRankAndSave query:shipping.when",sd, ':',ed,'==',self.rank)
    self.save(cb)
  })
}

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
}

//
// status == reserved||fulfilled, payment==pending||refund||voided 
Orders.methods.rollbackProductQuantityAndSave=function(reason, callback){
  assert(callback)
  var Q=require('q'),deferred = Q.defer(), tasks=[];
  var self=this


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
    // after rollback order is no more available
    // self.fulfillments.status="failure";

    //
    // status is canceled
    // self.cancel.reason=reason;
    // self.cancel.when=new Date();
    // self.closed=new Date();

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

}

//
// find open orders with financial status not paid
Orders.statics.findByTimeoutAndNotPaid = function(callback){
  var q={
    closed:null,
    "payment.status":{'$nin':['paid','authorized']},
    created:{"$lte": new Date().getTime()-config.shop.order.timeoutAndNotPaid*1000}
  }


  // console.log(q)
  var query=db.model('Orders').find(q).sort({created: -1});
  if (callback) return query.exec(callback);

  return query;
}

//
// create a new order
Orders.statics.create = function(items, customer, shipping, paymentData, callback){
  assert(items);
  assert(customer);
  assert(shipping);
  assert(callback);
  var db=this
    , now =new Date()
    , Orders=db.model('Orders')
    , Products=db.model('Products')
    , order={};


  // remove min/sec to compute the timeleft for shipping
  now.setHours(now.getHours(),0,0,0)

  //
  // simple items check
  if(!items.length){
    return callback("items are required.")
  }

  //
  // check shipping maintenance
  if(config.shop.maintenance.active){
    return callback("Les livraisons ne sont pas possibles pour l'instant")    
  }

  //
  // check the shipping day
  if(!shipping.when){
    return callback("La date de livraison est obligatoire")
  }
  // be sure that is a Date object
  shipping.when=new Date(shipping.when)

  if(config.shop.noshipping&&config.shop.noshipping.length){
    for (var i = config.shop.noshipping.length - 1; i >= 0; i--) {
      var noshipping=config.shop.noshipping[i];
      var from = new Date(noshipping.from);
      var to=new Date(noshipping.to);
      var msg="Les livraisons sont interrompues jusqu'au "+Orders.formatDate(to);
      from.setHours(1,0,0,0);
      to.setHours(1,0,0,0);
      if((shipping.when>=from && shipping.when<to)){
        return callback(noshipping.reason||msg)      
      }

    };
  }




  //
  // check that shipping day is available on: config.shop.order.weekdays
  if (config.shop.order.weekdays.indexOf(shipping.when.getDay())==-1){
    return callback("La date de livraison n'est pas valable")
  }

  var when=new Date(shipping.when).setHours(config.shop.order.timelimitH,0,0,0)
  if(Math.abs((when-now.getTime())/3600000) < config.shop.order.timelimit){
    return callback("Cette date de livraison n'est plus disponible.")
  }

  //
  // check time for delivery
  var times=Object.keys(config.shop.order.shippingtimes)
  if(times.indexOf(String(shipping.when.getHours()))==-1){
    return callback("L'heure de livraison n'est pas valable")
  }


  // early test
  // make sure that payment issuer belongs to this customer
  try{

    if(!paymentData||!customer.id ||!payment.for(paymentData.issuer).isPaymentObjectValid(paymentData)){
      return callback("Votre commande est incomplète, l'ordre ne peut pas êtree passé")
    } 

    if(!payment.for(paymentData.issuer).isValidAlias(paymentData.alias,customer, paymentData.issuer)){
      return callback("Votre méthode de paiement est invalide, l'ordre ne peut pas être passé")
    }

  }catch(error){
    return callback(error.message)    
  }

  //
  // get unique Order identifier
  db.model('Sequences').nextOrder(function(err,oid){
    if(err){
      callback((err));
      return;
    }
    //
    // set oid
    order.oid=oid;

    //
    // checking customer data
    if(!customer.email||customer.email.status!==true){
      return callback('valid email is required.')
    }

    //
    // checking shipping data
    if (!shipping ||Object.keys(shipping).length<3
                  ||!shipping.name
                  ||!shipping.streetAdress
                  ||!shipping.floor
                  ||!shipping.postalCode
                  ||!shipping.region){
      return callback('shipping address is missing or imcomplet.')
    }


    Orders.checkItems(shipping, items,function(err, products,vendors, errors){
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




      debug('create new orders for %s on %s with %d items',shipping.name,shipping.when,items.length)

      //
      // attache items on success,
      order.items=items;
      order.vendors=_.uniq(vendors,false,function(e){return e.slug;});


      //
      // adding customer info and email (check validity)
      order.customer={
        id:customer.id,
        displayName:customer.displayName,
        created:customer.created,
        status:customer.status,
        addresses:customer.addresses,
        phoneNumbers:customer.phoneNumbers,
        name:customer.name,
        email:customer.email
      }
      order.email=customer.email.address;

      //
      // adding shipping address (minimum 3 fields
      // for general error msg)
      order.shipping={
        name:shipping.name,
        note:shipping.note,
        streetAdress:shipping.streetAdress,
        floor:shipping.floor,
        postalCode:shipping.postalCode,
        region:shipping.region,
        geo:shipping.geo,
        when:shipping.when
      };

      //
      // adding paymentData
      order.payment={
        alias:paymentData.alias,
        number:paymentData.number,
        issuer:paymentData.issuer,
        fees:{shipping:null}
      };

      //
      // ready to create one order
      var dborder =new Orders(order);

      dborder.payment.fees.shipping=dborder.getShippingPrice()

      //
      // update product stock
      return dborder.updateProductQuantityAndSave(function(e,o){
        if(e){return callback(e)}
        //
        // rank this order
        o.computeRankAndSave(callback);

      })




    });

  });


};



//
// find the last order for a shop
Orders.statics.findByCriteria = function(criteria, callback){
  assert(criteria);
  var db=this
    , Orders=db.model('Orders')
    , Products=db.model('Products');

  var q={};

  // filter by OIDs
  if(criteria.oid){
      //
      // force integers
      var oids=criteria.oid.split(/[,+]/)
      oids.forEach(function(x,y,z){ z[y]=x|0 });
      q['oid']={$in:oids}
  }


  //
  // filter by shop or shops
  if(criteria.shop){
    if(Array.isArray(criteria.shop)){
      q["vendors.slug"]={"$in":criteria.shop};
    }else{
      q["$or"]=[{"items.vendor":criteria.shop},{"vendors.slug":criteria.shop}]
    }
  }


  //
  // filter by closed date
  if((criteria.closed === null || criteria.closed === undefined)&&
     !criteria.fulfillment&&
     !criteria.reason){
    q["closed"]={'$exists':false};
  }
  else if(criteria.closed === true){
    var sd=new Date('1980'),
        ed=new Date();
    //q["closed"]={"$gte": sd, "$lt": ed};
    q["closed"]={'$exists':true};
  }
  else if(criteria.closed ){
    criteria.closed=new Date(criteria.closed)
    var sd=new Date(criteria.closed.getFullYear(), criteria.closed.getUTCMonth(), criteria.closed.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["closed"]={"$gte": sd, "$lt": ed};
  }


  //
  // filter by next shipping date
  if(criteria.nextShippingDay){
    var next=this.findCurrentShippingDay();
    var sd=new Date(next.getFullYear(), next.getUTCMonth(), next.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }
  //
  // filter by date (24h = today up to tonight)
  if(criteria.when){
    var sd=new Date(criteria.when.getFullYear(), criteria.when.getMonth(), criteria.when.getDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }


  //
  // filter by free date
  if(criteria.from && criteria.to){
    if(criteria.padding===true){
      criteria.to=new Date(criteria.to.getTime()+7*86400000)
    }

    var sd=new Date(criteria.from.getFullYear(), criteria.from.getMonth(), criteria.from.getDate());
    //
    // do not remove the time limit of the ending date!
    var ed=new Date(criteria.to);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }



  //
  // filter by user
  if(criteria.user){
    // q["email"]=criteria.user
    q["customer.id"]=parseInt(criteria.user);
    if(criteria.closed === null || criteria.closed === undefined){
      delete (q["closed"])   
    }
  }

  if(criteria.fulfillment){
    var multiple=criteria.fulfillment.split(',');
    q["fulfillments.status"]=(multiple.length>1)?{$in:multiple}:criteria.fulfillment;
  }

  if(criteria.reason){
    q["cancel.reason"]=criteria.reason;
  }

  //
  // filter by user
  if(criteria.payment){
    // q["email"]=criteria.user
    q["payment.status"]=criteria.payment;
  }
  debug("find criteria ",q)
  var query=Orders.find(q).sort({created: -1});

  //
  // FIXME get plain javascript object
  if(criteria.shop){
    query=query.lean()
  }
  if (callback)
    return query.exec(callback);
  return query;
}


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

Orders.statics.onRefund = function(oid, callback){
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
    payment.for(order.payment.issuer).refund(order)
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

//
// only finalprice and note can be modified for an item
// status == reserver,partial ,  payment==authorized
Orders.statics.updateItem = function(oid,items, callback){
  assert(oid);
  assert(items);
  db.model('Orders').findOne({oid:oid},function(err,order){
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

    // cancelreason:["customer", "fraud", "inventory", "other"],
    if(order.cancel&&order.cancel.when){
      return callback("Impossible de modifier une commande annulée: "+oid);
    }
    //["pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"]
    if(["authorized"].indexOf(order.payment.status)==-1){
      return callback("Impossible de modifier une commande sans validation financière : "+order.payment.status);
    }


    if(["reserved","partial"].indexOf(order.fulfillments.status)==-1){
      return callback("Impossible de modifier une commande avec le status: "+order.fulfillments.status);
    }


    var itemIds=[], rollback=[];
    items.forEach(function(item){
      assert(item.sku)
      for(var i in order.items){
        if(order.items[i].sku===item.sku){
          if(item.finalprice) order.items[i].finalprice=item.finalprice;
          if(item.note)       order.items[i].note=item.note;
          if(item.fulfillment)order.items[i].fulfillment.status=item.fulfillment.status;

          // this item has bean removed from the order
          if(item.fulfillment.status==='failure'){
            rollback.push({sku:item.sku,qty:item.quantity})
            //order.items[i].finalprice=item.finalprice=0.0;
          }
          itemIds.push(order.items[i].sku);
          break;
        }
      }
    })

    // console.log('-----------> items:',_.collect(items,function(i){return i.sku}))
    // console.log('-----------> order.items:',_.collect(order.items,function(i){return i.sku}))
    // console.log('-----------> fulfillment:',_.collect(order.items,function(i){return i.fulfillment.status}))


    if(itemIds.length!==items.length){
      var itemIds=items.filter(function(e){
          return (itemIds.indexOf(e.sku)===-1);
      })

      return callback("L'action est annulée, les articles suivants ne concernent pas cette commande : "+itemIds.map(function(i){return i.sku}).join(', '));
    }

    //
    // notify this order has been successfully modified
    bus.emit('order.update.items',null,order,items)

    // if the order is not fulfilled
    order.fulfillments.status='fulfilled'
    order.items.forEach(function(item){
      if(['failure','fulfilled'].indexOf(item.fulfillment.status)===-1){
        order.fulfillments.status='partial'
      }
    })

    order.save(callback)
    // I DONT KNOW WHY THE NATIVE UPDATE IS NOT WORKING!!!
    // order.update({'items.id': itemId.id}, {'$set': {
    //     'items.$.finalprice': item.finalprice,
    //     'items.$.note': item.note,
    //     'items.$.fulfillment.status':item.fulfillment.status,
    //     'items.$.sku':itemId.sku,
    //     'items.$.title':itemId.title,
    //     'items.$.quantity':itemId.quantity,
    //     'items.$.price':itemId.price,
    //     'items.$.part':itemId.part,
    //     'items.$.category':itemId.category,
    //     'items.$.vendor':itemId.vendor,
    //     'items.$.fulfillment.shipping':itemId.fulfillment.shipping
    // }}, callback);

  });
}


//
// only finalprice and note can be modified for an item
// status == reserver,partial ,  payment==authorized
Orders.statics.updateLogistic = function(query,options, callback){
  assert(query);
  assert(options);
  var saveTasks=[], Q=require('q');

  if(options.status === undefined){
    return callback("Ooops error updateLogistic missing param");          
  }



  //
  // select orders by date
  if(query['vendors.slug']){
    var when=Date.parse(options.when);
    if(!when||when==NaN){
      return callback("Ooops error updateLogistic missing date ");                
    }
    // date is ok
    when=new Date(when)

    var sd=new Date(when.getFullYear(), when.getUTCMonth(), when.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    query["shipping.when"]={"$gte": sd, "$lt": ed};

    //
    // in this case do not find closed order!
    query["closed"]={'$exists':false};

  //
  // select order by OID
  }else if(!query.oid){
    return callback('Ooops error updateLogistic missing order selector ')
  }

  db.model('Orders').find(query,function(err,orders){
    if(err){
      return callback(err)
    } 

    if(!orders.length){
      if(query.oid) return callback("Impossible de trouver la commande: "+query.oid);
      return callback("Impossible de trouver une commande pour la boutique: "+query['vendors.slug']);
    }

    for (var i=0; i < orders.length; i++) {
      //
      // fill an array of promises
      saveTasks.push((function(order) {
        var deferred = Q.defer();

        //
        // check order status
        if(order.closed){
          return Q.reject(("Impossible de livrer une commande fermée: "+order.oid))
        }

        // cancelreason:["customer", "fraud", "inventory", "other"],
        if(order.cancel&&order.cancel.when){
          return Q.reject(("Impossible de livrer une commande annulée: "+order.oid))
        }
        //["pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"]
        if(["authorized"].indexOf(order.payment.status)==-1){
          return Q.reject(("Impossible de livrer une commande sans validation financière : "+order.payment.status));
        }


        // TODO this is not needed
        // if(["fulfilled"].indexOf(order.fulfillments.status)==-1){
        //   return Q.reject(("Impossible de livrer une commande avec le status: "+order.fulfillments.status));
        // }


        var statusShopper=Boolean(options.status)

        //
        // vendor is collected?
        if(query['vendors.slug']){
          for (var i = order.vendors.length - 1; i >= 0; i--) {
            if(order.vendors[i].slug===query['vendors.slug']){
              order.vendors[i].collected=statusShopper;
              break;
            }
          };
        }
        // customer is shipped
        else{
          order.shipping.shipped=statusShopper;
        }

        // return order.save()
        order.save(function (err,order) {
          if(err){return deferred.reject(err);}
          deferred.resolve(order)
        })
        return deferred.promise;
      })(orders[i]));
    }
    //
    // notify this order has been successfully modified
    bus.emit('order.update.logistic',null,orders,options)

    return Q.all(saveTasks).then(function(){

      callback(null,orders)
    },function(err) {
      callback(err)
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
    var slugs=Orders.getVendorsSlug(orders)
    return db.model('Shops').findAllBySlug(slugs,function(err,shops) {
      cb(null,Orders.convertOrdersToRepportForShop(criteria.from, criteria.to, orders, shops,criteria.showAll))
    });


  });


};

//
// TODO need a comment here!
Orders.statics.getStatsByOrder=function(query){
  query=query||{ closed: { '$exists': false } };

  return db.model('Orders').aggregate(
     [
       { $match: query },
       {$project:{week: { $week: "$shipping.when"}, year: { $year: "$shipping.when" },
                 items:1,
                 shipping:1,
                 oid:1
       }},
       {$unwind: '$items'}, 
       {$group:
           {
             _id:"$oid",
             week:{$first:"$week"},
             totalAmount: { $sum: "$items.finalprice" },
             count: { $sum: "$items.quantity" }
           }
       },
       {$sort:{week:-1}}
     ]
  )
}


Orders.set('autoIndex', config.mongo.ensureIndex);
exports.Orders = mongoose.model('Orders', Orders);
