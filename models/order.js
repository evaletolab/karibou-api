

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , bus = require('../app/bus')
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
      logs:[String],
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
// API


Orders.methods.print=function(order){
  mongoose.model('Orders').print(this)
}

Orders.statics.print=function(order){
  var self=order
  console.log("-- OID    ", self.oid);
  console.log("---      shipped       ",  self.shipping.shipped);
  console.log("---      shipping.when ",  self.shipping.when);
  console.log("---      payment       ",  self.payment.status,self.payment.issuer);
  console.log("---      fulfillments  ",  self.fulfillments.status);
  if(self.getTotalPrice){
    console.log("---      full price    ",  self.getTotalPrice())
  }
  if(self.cancel){
    console.log("---      cancel.status ",  self.cancel.reason);
    console.log("---      cancel.when   ",  self.cancel.when);
  }
  console.log("---      closed        ",  self.closed);
  console.log("---      created       ",  self.created);
  console.log("---      user          ",  self.email);
  console.log("---      rank          ",  self.rank);
  if(self.items){
    console.log("---      items           ",  self.items.map(function(i){ return i.sku}).join(','));
    console.log("---      + finaleprice   ",  self.items.map(function(i){ return i.finalprice}).join(','));
    console.log("---      + quantity      ",  self.items.map(function(i){ return i.quantity}).join(','));
    console.log("---      + status        ",  self.items.map(function(i){ return i.fulfillment.status}).join(','));
  }
  if(self.vendors){
    console.log("---      vendors       ",  self.vendors.map(function(v){ return v.slug}).join(','));
    console.log("---      collected     ",  self.vendors.map(function(v){ return v.collected}).join(','));
  }
}

Orders.statics.printInfo=function(){
  var now=new Date()
  console.log("-- now it's   ", now);
  console.log("-- available shipping days   ", config.shop.order.weekdays.join(','));
  console.log("-- order payment timelimite (s)   ", config.shop.order.timeoutAndNotPaid);
  console.log("-- order preparation timelimit (hours)   ", config.shop.order.timelimit);
  console.log("--    ");
  console.log("-- next shipping day for customers  ", this.findNextShippingDay());
  console.log("-- next shipping day for sellers  ", this.findCurrentShippingDay());
}

//
// prepare one product as order item
Orders.statics.prepare=function(product, quantity, note, shops){
  var copy={}, keys=['sku','title','categories','vendor'];
  function getPrice(p){
    if(p.attributes.discount && p.pricing.discount)
      return p.pricing.discount;
    return p.pricing.price;
  }

  assert(product)
  assert(product.vendor)

  keys.forEach(function(key){
    copy[key]=product[key];
  })

  if(shops){
    copy.vendor=_.find(shops,function(shop){return (shop._id+'')===copy.vendor}).urlpath
  }

  copy.quantity=quantity;
  copy.price=getPrice(product)
  copy.part=product.pricing.part;
  copy.note=note;
  copy.finalprice=getPrice(product)*quantity;
  copy.fulfillment={status:'partial'}
  return copy;
}

/**
 * total price
 *  - some of item finalprice ()
 *  - add payment gateway fees [visa,postfinance,mc,ae]
 *  - add shipping
 */
Orders.methods.getTotalPrice=function(factor){
  var total=0.0;
  this.items&&this.items.forEach(function(item){
    //
    // item should not be failure (fulfillment)
    if(item.fulfillment.status!=='failure'){
      total+=item.finalprice;
    }
  });

  // before the payment fees! 
  // add shipping fees (10CHF)
  total+=config.shop.marketplace.shipping;

  //
  // add gateway fees
  for (var gateway in config.shop.order.gateway){
    gateway=config.shop.order.gateway[gateway]
    if (gateway.label===this.payment.issuer){
      total+=total*gateway.fees;
      break;
    }
  }

  // add mul factor
  factor&&(total*=factor);


  return parseFloat((Math.round(total*20)/20).toFixed(2));
}

Orders.methods.getSubTotal=function(){
  var total=0.0;
  this.items&&this.items.forEach(function(item){
    //
    // item should not be failure (fulfillment)
    if(item.fulfillment.status!=='failure'){
      total+=item.finalprice;
    }
  });

  return parseFloat((Math.round(total*20)/20).toFixed(2));
}

//
// format date for this order
Orders.methods.getDateString=function(date){
  return db.model('Orders').formatDate(date||this.shipping.when,(date===undefined));
}


Orders.statics.formatDate=function(date, withTime){
  var format={
    months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
  }

  var when=new Date(date);
  var m=format.months[when.getMonth()];
  var d=format.weekdays[when.getDay()]
  var day=when.getDate()
  // set time
  var time='';if(withTime)time=" de "+config.shop.order.shippingtimes[when.getHours()];

  return d+" "+day+" "+m+" "+when.getFullYear()+time;
}



//
// filter order content by User//Shop 
Orders.statics.filterByShop=function(orders,shopname){
  assert(shopname)
  assert(orders)
  var i=0, toKeep=[];

  orders.forEach(function(order,j){
    //
    // remove exo shops
    i=order.vendors.length;while (i--){
      if(shopname.indexOf(order.vendors[i].slug)===-1){
          order.vendors.splice(i,1)
      }
    }
    if(order.vendors.length){
      toKeep.push(order)
    }
  })

  toKeep.forEach(function(order,j){
    //
    // remove exo items
    i=order.items.length;while (i--){
      if(shopname.indexOf(order.items[i].vendor+'')===-1){
          order.items.splice(i,1)
      }
    }


  })

  return toKeep
}

Orders.statics.getVendorsSlug=function  (orders) {
  if(!orders)return [];
  var slugs=orders.map(function (order) {    
      return order.vendors.map(function (vendor) {
        return vendor.slug;
      })
  })
  return _.uniq(_.flatten(slugs))
}

//
// group by shop
Orders.statics.groupByShop=function(orders){
  assert(orders)
  var shops={}
  function findOneVendor(order,slug){
    for (var i = order.vendors.length - 1; i >= 0; i--) {
      if(order.vendors[i].slug===slug)return order.vendors[i]
    };
  }
  orders.forEach(function(order){
    order.items.forEach(function(item){

      // init item for this shop
      if(!shops[item.vendor]){
        shops[item.vendor]={items:[],details:null}
      }
      // add item to this shop
      item.rank=order.rank
      item.oid=order.oid
      item.email=order.email
      item.customer=order.customer
      item.created=order.created
      item.shipping=order.shipping
      item.fulfillments=order.fulfillments
      shops[item.vendor].items.push(item);
      if(!shops[item.vendor].details){
        shops[item.vendor].details=findOneVendor(order,item.vendor)
      }
    })
  })
  return shops
}

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
    , msg6="Ce produit n'est pas disponible car la boutique est momentanément fermée"
    , msg7="La quantité souhaitée n'est pas disponible "
    , msg8="Ce produit n'est plus en stock "


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

  if(product.vendor.available&&product.vendor.available.active===true){
    return cb(msg6,item)
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

/* jump the N day in week (0=sunday,1=monday, ...)
 * if next N day is before today then jump next week
 */
Orders.statics.jumpToNextWeekDay=function(date, jump) {
  // 86400000[ms] = 24 * 60² * 1000
  var nextday=((jump-date.getDay())%7)
  var week=(nextday>=0)?0:7*86400000;
  var nextweek=new Date(+date.getTime()+nextday*86400000+week)
  // next date always includes all shipping times: 12:00, 17:00, 19:00 ... <=23h00
  nextweek.setHours(23,0,0,0)
  return nextweek;

}

/* return array of one week of shipping days available for customers*/
Orders.statics.findOneWeekOfShippingDay=function(){
  var next=this.findNextShippingDay(), all=[], nextDate=next

  // get current day in the array
  var idxDay=config.shop.order.weekdays.indexOf(next.getDay());

  //
  // end of week
  for (var i = idxDay; i < config.shop.order.weekdays.length; i++) {
    nextDate=new Date((config.shop.order.weekdays[i]-nextDate.getDay())*86400000+nextDate.getTime());
    nextDate.setHours(next.getHours(),0,0,0)
    all.push(nextDate)
  };

  //
  // ellapsed time before the end of week
  nextDate=new Date((7-nextDate.getDay())*86400000+nextDate.getTime());

  //
  // next week
  for (var i = 0; i < idxDay; i++) {
    nextDate=new Date((config.shop.order.weekdays[i]-nextDate.getDay())*86400000+nextDate.getTime());
    nextDate.setHours(next.getHours(),0,0,0)
    all.push(nextDate)
  };



  // config.shop.order.weekdays.forEach(function(day){
  //   // next = 2
  //   // all=[1,2,4]
  //   // result =[2,4,1]
  //   console.log('day, next day--------',day, next.getDay())
  //   if(day<next.getDay()){
  //     // 7-5+1=3 => 5+3=(8%)
  //       nextDate=new Date((7-next.getDay()+day)*86400000+next.getTime());
  //       nextDate.setHours(next.getHours(),0,0,0)
  //       console.log('before-----------',nextDate.getDay())
  //       if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
  //         all.push(nextDate)
  //   }else if(day>=next.getDay()){
  //       nextDate=new Date((day-next.getDay())*86400000+next.getTime())
  //       nextDate.setHours(next.getHours(),0,0,0)
  //       if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
  //         all.push(nextDate)
  //   }
  // })

  return all.sort(function(a,b){
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    return a.getTime() - b.getTime();
  });
}

Orders.statics.findNextShippingDay=function(tl,th){
  var now=new Date(), 
      next, 
      timelimit=tl||config.shop.order.timelimit,
      timelimitH=th||config.shop.order.timelimitH;
      // 24h == 86400000

      // remove min/sec
      now.setHours(now.getHours(),0,0,0)

  // looking for end of the week 
  for (var i = 0; i < config.shop.order.weekdays.length; i++) {
    var day=config.shop.order.weekdays[i];
    if(day>=now.getDay()){
      // a valid day is at least>=timelimit 
      next=new Date(now.getTime()+86400000*(day-now.getDay()))      
      next.setHours(timelimitH,0,0,0)
      console.log('----- this week -- delta 1',((next.getTime()-now.getTime())/3600000),timelimit,(day-now.getDay()))
      if(((next.getTime()-now.getTime())/3600000)>timelimit){
        //console.log('return this',next)
        return next;
      }
    }
  }

  // looking for begin of the week 
  for (var i = 0; i < config.shop.order.weekdays.length; i++) {
    var day=config.shop.order.weekdays[i];
    if(day<now.getDay()){
      next=new Date((7-now.getDay()+day)*86400000+now.getTime());
      next.setHours(timelimitH,0,0,0)
      console.log('----- next week -- delta 2',((next.getTime()-now.getTime())/3600000),timelimit,((7-now.getDay()+day)))
      if(((next.getTime()-now.getTime())/3600000)>timelimit){
        //console.log('for next week',next)
        return next;
      }
    }

  }



}



/* return the current shipping day this is for sellers*/
Orders.statics.findCurrentShippingDay=function(){
  var timelimitH=Number(Object.keys(config.shop.order.shippingtimes).sort()[0])+8
  timelimitH=23;
  return this.findNextShippingDay(0.1,Number(timelimitH))
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
  Products.findBySkus(skus).sort("sku").exec(function(err,products){
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
  if(["pending","refund",'voided'].indexOf(self.payment.status)===-1){
    return callback("Impossible d'annuler une commande avec le status: "+self.fulfillments.status);
  }

  //
  // accepted payment status for rollback
  if(["fulfilled","reserved"].indexOf(self.fulfillments.status)===-1){
    return callback("Impossible d'annuler une commande avec le status: "+self.fulfillments.status);
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
    self.fulfillments.status="failure";

    //
    // status is canceled
    self.cancel.reason=reason;
    self.cancel.when=new Date();
    self.closed=new Date();

    //
    // this checking generate a list of products
    return self.save(callback)

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
  if(config.shop.global.maintenance.active){
    return callback("Les livraisons ne sont pas possibles pour l'instant")    
  }

  //
  // check the shipping day
  if(!shipping.when){
    return callback("La date de livraison est obligatoire")
  }
  // be sure that is a Date object
  shipping.when=new Date(shipping.when)

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
        issuer:paymentData.issuer
      };

      //
      // ready to create one order
      var dborder =new Orders(order);


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
  assert(callback);
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
    var sd=new Date(criteria.when.getFullYear(), criteria.when.getUTCMonth(), criteria.when.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }


  //
  // filter by free date
  if(criteria.from && criteria.to){
    if(criteria.padding===true){
      criteria.to=new Date(criteria.to.getTime()+7*86400000)
    }
    var sd=new Date(criteria.from.getFullYear(), criteria.from.getUTCMonth(), criteria.from.getUTCDate());
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
  // get plain javascript object
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

    //
    // === admin cancel ===
    // 2) from admin => reason=fraud|inventory|other(|timeout|system)
    // status=created|reserved, payment=pending|authorized
    // status=fulfilled, payment=authorized
    // status=fulfilled, payment=paid
    if(reason!=='customer'){
    }
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
