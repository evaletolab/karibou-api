

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
var EnumOrderGateway   =_.map(config.shop.order.gateway,
                            function(e){return e.label});
var EnumShippingMode   =config.shop.order.shippingmode;

var Orders = new Schema({
   /** order identifier */
   oid: { type: Number, required: true, unique:true },
   
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
      gateway:{type:String,enum: EnumOrderGateway, required:true},
      status:{type:String, enum:EnumFinancialStatus, default:'pending'}
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

Orders.methods.getTotalPrice=function(){
  var total=0.0;
  this.items.forEach(function(item){
    total+=item.finalprice*item.quantity;
  });

  return total;
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
  copy.price=getPrice(product)*quantity
  copy.part=product.pricing.part;
  copy.note=note;
  copy.finalprice=copy.price;
  return copy;
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
  var msg1="Votre article est incomplet. Les données dans votre panier ne sont plus valables "
    , msg2="Ce produit n'est plus disponible "
    , msg3="Le prix de votre produit a été modifié par le vendeur "
    , msg4="La quantité d'achat minimum est de 1 "
    , msg5="Ce produit n'est pas disponible car la boutique a été désactivé par l'équipe Kariboo"
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

  if(product.vendor.status!==true){
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

  if(item.quantity>product.pricing.stock){
    return cb(msg7,item)
  }


  //
  // check item is correct
  // Math.round(value*100)/100
  // if prodduct has discount, price should be computed with
  var price=product.getPrice()*item.quantity;
  if(item.price.toFixed(1)!=price.toFixed(1)){
    return cb(msg3,item)
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
  return new Date(+date.getTime()+nextday*86400000+week);

}

/* return the next shipping day */
Orders.statics.findNextShippingDay=function(){
  var next=new Date(Date.now()+config.shop.order.timelimit*3600000);
  while(config.shop.order.weekdays.indexOf(next.getDay())<0){
    next=new Date(next.getTime()+86400000)
  }
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
  var skus=_.collect(items,function(item){return item.sku});
  Products.findBySkus(skus).sort("sku").exec(function(err,products){
    assert(skus.length===products.length)

    var vendors=[], errors=[];

    var i=-1;require('async').each(items, function(item, cb) {
      i++;//get the iterator


      //
      // check an item
      Orders.checkItem(items[i],products[i],function(err,item, vendor){
        vendors.push(vendor);
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


Orders.methods.updateProductQuantityAndSave=function(callback){
  assert(callback)

  var order=this;
  var msg1="Could not update product quantity for paid or partialy fulfilled order";


  if(this.fulfillments.status ==="partial" || this.payment.status==="paid"){
    callback(msg1)
  }

  require('async').each(this.items, function(item, cb) {
    db.model('Products').update({sku:item.sku},{$inc: {"pricing.stock":-item.quantity}}, { safe: true }, cb)
  },function(err){
    //
    // if catching an error durring the update, roolback
    // which product must be rollback????
    if(err){
      callback(err);
      throw new Error("rollback not implemented: "+(err.message||err));
    }
    //
    order.fulfillments.status="partial";
    return order.save(callback)
  });
}

Orders.methods.rollbackProductQuantityAndSave=function(callback){
  assert(callback)

  var msg1="Could not rollback product quantity for paid order", 
      msg2="Rollback product quantity is possible when there is a fulfilled item in the order";

  var order=this;

  //
  // you can rollback an order only if fulfillments=="partial" and payment!=="paid"
  if(this.payment.status==="paid"){
    callback(msg1)
  }
  if(this.fulfillments.status !=="partial"){
    callback(msg2)
  }

  require('async').each(this.items, function(item, cb) {
    db.model('Products').update({sku:item.sku},{$inc: {"pricing.stock":item.quantity}}, { safe: true }, cb)
  },function(err){
    if(err){
      callback(err);
      throw new Error("rollback: "+(err.message||err));
    }
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
    "payment.status":{'$ne':'paid'},
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
    return callback("shipping date is required.")
  }
  // be sure that is a Date object
  shipping.when=new Date(shipping.when)

  // 
  // check that shipping day is available on: config.shop.order.shippingdays
  var days=Object.keys(config.shop.order.shippingdays);
  if (!config.shop.order.shippingdays[days[shipping.when.getDay()]].active){
    return callback("selected shipping day is not available.")
  }


  if(Math.abs((Date.now()-shipping.when.getTime())/3600000) < config.shop.order.timelimit){
    return callback("selected shipping day is to short.")    
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

      //
      // attache items on success,
      order.items=items;
      order.vendors=_.uniq(vendors,false,function(a,b){return a.slug===b.slug;});

      //
      // adding customer email (check validity)
      order.customer=customer;
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
      order.payment={gateway:payment};

      //
      // ready to create one order
      var dborder =new Orders(order);

      db.model('Users').findOneAndUpdate({id:customer.id}, {$push: {orders: oid}},function(e,u){
        if(e){return callback(e)}

        //
        // update product stock
        return dborder.updateProductQuantityAndSave(callback)

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
  //
  // filter by shop
  if(criteria.shop){
    q["items.vendor"]=criteria.shop;
  }

  //
  // filter by closed date
  if(criteria.closed && criteria.closed!=null){
    var sd=new Date(criteria.closed.getFullYear(), criteria.closed.getUTCMonth(), criteria.closed.getUTCDate()),
        ed=new Date(sd.getTime()+86400000);
    q["closed"]={"$gte": sd, "$lt": ed};
  }
  if(criteria.closed===null){
    q["closed"]=null; 
  }


  //
  // filter by next shipping date
  if(criteria.nextShippingDay){
    var next=this.findNextShippingDay();
    var sd=new Date(next.getFullYear(), next.getUTCMonth(), next.getUTCDate()),
        ed=new Date(sd.getTime()+86400000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }
  //
  // filter by date (24h = today up to tonight)
  if(criteria.when){
    var sd=new Date(criteria.when.getFullYear(), criteria.when.getUTCMonth(), criteria.when.getUTCDate()),
        ed=new Date(sd.getTime()+86400000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }

  //
  // filter by user
  if(criteria.user){
    // q["email"]=criteria.user
    q["customer.id"]=criteria.user;
  }

  //
  // filter by user
  if(criteria.payment){
    // q["email"]=criteria.user
    q["payment.status"]=criteria.payment;
  }

  var query=Orders.find(q).sort({created: -1});
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


