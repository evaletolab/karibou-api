

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , bus = require('../app/bus')
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
   created:{type: Date, default: Date.now() },
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
      number:{type:String, required:true},
      issuer:{type:String,enum: EnumOrderMethod, required:true},
      status:{type:String, enum:EnumFinancialStatus, default:'pending'},

      /*for security reason transaction data are encrypted */
      transaction:{type:String}
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
   }],        
   
   shipping:{
      when:{type:Date, required:true},
      name:{type:String, required:true},
      note:{type:String},
      streetAdress:{type:String,required:true},
      floor:{type:String, required:true},
      postalCode:{type:String, required:true},
      region:{type:String, required:true},      
      geo:{
        lat:{type:Number, required: true},
        lng:{type:Number, required: true}
      }      
   }   
   

});

//
// API

/**
 * total price
 *  - some of item finalprice ()
 *  - add payment gateway fees [visa,postfinance,mc,ae]
 *  - add shipping
 */
Orders.methods.getTotalPrice=function(){
  var total=0.0;
  this.items&&this.items.forEach(function(item){
    //
    // item should not be failure (fulfillment)
    if(item.fulfillment!=='failure'){
      total+=item.finalprice;
    }
  });

  //
  // add payment fees
  for (var gateway in config.shop.order.gateway){
    gateway=config.shop.order.gateway[gateway]
    if (gateway.label===this.payment.issuer){
      total+=total*gateway.fees;
      break;
    }
  }
  
  // add shipping fees (10CHF)
  total+=config.shop.marketplace.shipping;

  return parseFloat((Math.ceil(total*20)/20).toFixed(2));
}

Orders.methods.print=function(order){
  mongoose.model('Orders').print(this)
}

Orders.statics.print=function(order){
  var self=order
  console.log("-- OID    ", self.oid);
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
  if(self.items)
  console.log("---      items         ",  self.items.map(function(i){ return i.sku}).join(',')); 
  console.log("---      quantity      ",  self.items.map(function(i){ return i.quantity}).join(',')); 
  if(self.vendors)
  console.log("---      vendors       ",  self.vendors.map(function(v){ return v.slug}).join(',')); 
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
Orders.statics.prepare=function(product, quantity, note){
  var copy={}, keys=['sku','title','categories','vendor'];
  function getPrice(p){
    if(p.attributes.discount && p.pricing.discount)
      return p.pricing.discount;
    return p.pricing.price;    
  }

  assert(product)
  assert(product.vendor)
  // check(product.attributes.available)

  keys.forEach(function(key){
    copy[key]=product[key];    
  })

  copy.quantity=quantity;
  copy.price=getPrice(product)
  copy.part=product.pricing.part;
  copy.note=note;
  copy.finalprice=getPrice(product)*quantity;
  return copy;
}

Orders.statics.filterByShop=function(shopname,orders){
  assert(shopname)
  assert(orders)
  var i=0;

  orders.forEach(function(order,j){
    //
    // remove exo shops
    i=order.vendors.length;while (i--){
      if(order.vendors[i].slug!==shopname){
          order.vendors.splice(i,1)
      }
    }
  })

  orders.forEach(function(order,j){
    //
    // remove exo items
    i=order.items.length;while (i--){
      if(order.items[i].vendor!==shopname){
          order.items.splice(i,1)
      }
    }


  })

  return orders
}


//
// check item
//  if item or product are !Nill
//  if item.category is !Nill
//  if item.vendor is !Nill and vendor==product.ID
//  if product is available
//  if item.quantity>product.pricing.stock
//  if item price is still correct
Orders.statics.checkItem=function(item, product, cb){
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

    vendor={
        ref:product.vendor._id,
        slug:product.vendor.urlpath,
        name:product.vendor.name,
        address:"TODO"
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
  var next=this.findNextShippingDay(), all=[next], nextDate

  config.shop.order.weekdays.forEach(function(day){
    // next = 2
    // all=[1,2,4]
    // result =[2,4,1]
    if(day<next.getDay()){
        nextDate=new Date((7-next.getDay()+day)*86400000+next.getTime());
        if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
          all.push(nextDate)
    }else if(day>next.getDay()){
        nextDate=new Date((day-next.getDay())*86400000+next.getTime())
        if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
          all.push(nextDate)
    }    
  })

  return all.sort(function(a,b){
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    return a.getTime() - b.getTime();
  });
}

/* return the next shipping day available for customers*/
Orders.statics.findNextShippingDay=function(){
  var now=new Date()
  // computing order start always at 18:00PM
  //now.setHours(18,0,0,0);
  now=now.getTime()
  var next=new Date(now+config.shop.order.timelimit*3600000);

  //
  // next is available until time  (timeLimitH)
  next.setHours(config.shop.order.timelimitH,0,0,0)

  var limit=Math.abs((now-next.getTime())/3600000) 
  while(config.shop.order.weekdays.indexOf(next.getDay())<0 || limit<config.shop.order.timelimit){
    next=new Date(next.getTime()+86400000)
    limit=Math.abs((now-next.getTime())/3600000) 
  }

  //
  // we dont care about seconds and ms
  next.setHours(next.getHours(),next.getMinutes(),0,0)
  
  return next;
}

/* return the current shipping day this is for sellers*/
Orders.statics.findCurrentShippingDay=function(){
  var next=new Date(), now=Date.now();

  // if next is today && next hours >= config.shop.order.timelimitH ==> select next day
  var elpased=Math.abs((now-next.getTime())/3600000) 
  while((config.shop.order.weekdays.indexOf(next.getDay())<0) || 
        (elpased<24 && next.getHours()>config.shop.order.timelimitH)){
    next=new Date(next.getTime()+86400000)
    elpased=Math.abs((now-next.getTime())/3600000)  
  }

  //
  // we dont care about seconds and ms
  next.setHours(next.getHours(),next.getMinutes(),0,0)
  return next;
}

//
// check items a new order
Orders.statics.checkItems = function(items, callback){
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

    var i=-1;require('async').eachLimit(items,1, function(item, cb) {
      i++;//get the iterator


      //
      // check an item
      Orders.checkItem(items[i],products[i],function(err,item, vendor){
        if(vendor)vendors.push(vendor);
        var error={}; error[item.sku]=err;
        //
        // collect error by product
        err&&errors.push(error)
        cb();
      })
    },function(err){
      //
      // this checking generate a list of products
      callback(err,products,vendors, errors)
    });

  });
}

Orders.methods.computeRankAndSave=function(cb){

  var self=this, sd=new Date(this.shipping.when), ed, promise, orderRank=1;
  sd.setHours(1,0,0,0)
  ed=new Date(sd.getTime()+86400000-3601000);
  db.model('Orders').find({"shipping.when":{"$gte": sd, "$lt": ed}}).exec(function(err,orders){
    self.rank=orders.length
    self.save(cb)
  })
}


Orders.methods.updateProductQuantityAndSave=function(callback){
  assert(callback)

  var self=this;
  var msg1="Could not update product quantity for paid or partialy fulfilled order";


  if(this.fulfillments.status !=="created" || this.payment.status==="paid"){
    callback(msg1)
  }


  require('async').eachLimit(this.items,1, function(item, cb) {

    //
    // rollback item quantity in stock
    debug("%d lock products quantity %s %s",self.oid, item.sku, -item.quantity)
    db.model('Products').update({sku:item.sku},{$inc: {"pricing.stock":-item.quantity}}, { safe: true }, cb)
  },function(err){
    //
    // if catching an error durring the update, rollback
    // which product must be rollback????
    if(err){
      callback(err);
      throw new Error("rollback not implemented: "+(err.message||err));
    }

    // we have to mention this state to avoid two times reservation
    self.fulfillments.status="reserved";
    return self.save(callback)
  });
}

Orders.methods.rollbackProductQuantityAndSave=function(callback){
  assert(callback)
  var self=this

  var msg1="Could not rollback product quantity for paid order", 
      msg2="Rollback product quantity is possible when there is a fulfilled item in the order";

  var order=this;

  //
  // you can rollback an order only if fulfillments=="partial" and payment!=="paid"
  if(this.payment.status==="paid"){
    callback(msg1)
  }
  if(this.fulfillments.status !=="reserved"){
    callback(msg2)
  }

  require('async').eachLimit(this.items,1, function(item, cb) {
    debug("%d unlock products quantity %s %d",self.oid, item.sku, item.quantity)
    db.model('Products').update({sku:item.sku},{$inc: {"pricing.stock":item.quantity}}, { safe: true }, cb)
  },function(err){
    if(err){
      callback(err);
      throw new Error("rollback: "+(err.message||err));
    }

    //
    // after rollback order is no more available
    order.fulfillments.status="failure";

    //
    // status is canceled
    order.cancel.reason='other';
    order.cancel.when=new Date();
    order.closed=new Date();


    //
    // this checking generate a list of products
    return order.save(callback)
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
Orders.statics.create = function(items, customer, shipping, payment, callback){
  assert(items);
  assert(customer);
  assert(shipping);
  assert(callback);
  var db=this
    , Orders=db.model('Orders')
    , Products=db.model('Products')
    , order={};


  //
  // simple items check
  if(!items.length){
    return callback("items are required.")
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
  if(Math.abs((Date.now()-when)/3600000) < config.shop.order.timelimit){
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
  if(!payment.alias ||!customer.id ||!payment.issuer||!payment.number){
    return callback("Votre commande est incomplète, l'ordre ne peut pas être passé")
  }

  if(!db.model('Users').isValidAliasWithId(payment.alias,customer.id, payment.issuer)){
    return callback("Votre méthode de paiement est inconnue, l'ordre ne peut pas être passé")
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
                  ||!shipping.note
                  ||!shipping.streetAdress
                  ||!shipping.floor
                  ||!shipping.postalCode
                  ||!shipping.region
                  ||!shipping.geo){
      return callback('shipping address is missing or imcomplet.')
    }

    
    Orders.checkItems(items,function(err, products,vendors, errors){
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
      order.vendors=_.uniq(vendors,false,function(a,b){return a.slug===b.slug;});

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
      // adding payment
      order.payment={
        alias:payment.alias,
        number:payment.number,
        issuer:payment.issuer
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
  // filter by shop
  if(criteria.shop){
    q["$or"]=[{"items.vendor":criteria.shop},{"vendors.slug":criteria.shop}]
    // q["items.vendor"]=criteria.shop;
    // q["vendors.slug"]=criteria.shop;
  }

  //
  // filter by closed date
  if((criteria.closed === null || criteria.closed === undefined)&&
     !criteria.fulfillment&&
     !criteria.reason){
    q["closed"]={$exists:false};     
  }
  else if(criteria.closed === true){
    var sd=new Date('1980'),
        ed=new Date();
    q["closed"]={"$gte": sd, "$lt": ed};
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
  // filter by user
  if(criteria.user){
    // q["email"]=criteria.user
    q["customer.id"]=parseInt(criteria.user);
  }

  if(criteria.fulfillment){
    q["fulfillments.status"]=criteria.fulfillment;
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
// only finalprice and note can be modified for an item
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
    if(["authorized","partially_paid","paid"].indexOf(order.payment.status)==-1){
      return callback("Impossible de modifier une commande en attente de validation financière (1): "+oid); 
    }

    //["failure","created","partial","fulfilled"]
    if(order.fulfillments.status!=="partial"){
      return callback("Impossible de modifier une commande en attente de validation financière (2): "+oid); 
    }


    var itemId=[];
    items.forEach(function(item){
      assert(item.sku)
      for(var i in order.items){
        if(order.items[i].sku===item.sku){
          if(item.finalprice) order.items[i].finalprice=item.finalprice;
          if(item.note)       order.items[i].note=item.note;
          if(item.fulfillment)order.items[i].fulfillment.status=item.fulfillment.status;
          itemId.push(order.items[i].sku);
          break;
        }
      }
    })
    if(itemId.length!==items.length){
      return callback("Impossible de modifer tous les articles. Les articles modifiés : "+itemId.join(', '));      
    }

    //
    // notify this order has been successfully modified
    bus.emit('order.update.items',null,order,items)


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



Orders.set('autoIndex', config.mongo.ensureIndex);
exports.Orders = mongoose.model('Orders', Orders);


