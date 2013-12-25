

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
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
var EnumOrderGateway   =config.shop.order.gateway;
var EnumShippingMode   =config.shop.order.shippingmode;

var Orders = new Schema({
   /** order identifier */
   oid: { type: Number, required: true, unique:true },
   
   /* customer email */
   email:{type: String, required:true},
   created:{type: Date, default: Date.now },
   closed:{type: Date, default: Date.now },
   
   /* full customer details */
   customer:{type: Schema.Types.Mixed, required:true},
   
   /* order canceled reason and dates */
   cancel:{
      reason:{type:String, enum:EnumCancelReason},
      when:{type: Date}
   },
   
   /* discount_code:{type: String}, */   
   /* cart_token:{type: String}, */
   
   financial_status:{type:String, enum:EnumFinancialStatus},

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

      vendor:{
        ref:{type: Schema.Types.ObjectId, ref : 'Shops', requiered:true},
        slug:{type:String, required:true},
        name:{type:String, required:true},
        fullName:{type:String, required:true},
        address:{type:String, required:true},
      }          
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
   },
   
   
   payment:{
      gateway:{type:String,enum: EnumOrderGateway, required:true}
   }   
   
});

//
// API


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
  var msg1="Ooops, votre article est incomplet. Les données de votre panier ne sont plus valables "
    , msg2="Ce produit n'est plus disponible "
    , msg3="Le prix de votre produit a été modifié par le vendeur "
    , msg4="La quantité d'achat minimum est de 1 "
    , msg5="Ce produit n'est pas disponible car la boutique a été désactivé par l'équipe Kariboo"
    , msg6="Ce produit n'est pas disponible car la boutique est momentanément fermée"
    , msg7="La quantité souhaitée n'est pas disponible "


  assert(item.sku==product.sku)

  //
  // check item and product exists
  if(!item || !product || item.sku!==product.sku){
    return cb(msg1)
  }

  //
  // add item.categories
  if(!item.category){
    item.category=product.categories[0].name
  }





  //
  // check item.vendor
  if(!item.vendor ){
    return cb(msg1)
  }

  if(product.vendor.status!==true){
    return cb(msg5)
  }

  if(product.vendor.available.active!==true){
    return cb(msg6)
  }

  if((typeof item.vendor) !=='object' ){
    assert(product.vendor._id.toString()===item.vendor.toString())
    item.vendor={
        ref:product.vendor._id,
        slug:product.vendor.urlpath,
        name:product.vendor.name,
        fullName:product.vendor.owner,
        address:"TODO"
    }
  }
  
  //
  // check item is still available in stock
  if(!product.attributes.available){
    return cb(msg2)
  }

  // check if item.quantity <1
  if(item.quantity<1){
    return cb(msg4)    
  }

  //
  // check item is still available in stock
  if(item.quantity>product.pricing.stock){
    return cb(msg7)
  }


  //
  // check item is correct
  // Math.round(value*100)/100
  // if prodduct has discount, price should be computed with
  var price=product.getPrice()*item.quantity;
  if(item.price.toFixed(1)!=price.toFixed(1)){
    return cb(msg3)
  }


  return cb(null,item)

  // mongoose.model('Products').findOneBySku(item.sku,function(err,product){    
  // })

}

Orders.statics.jumpToNextWeekDay=function(date, jump) {
  // 86400000[ms] = 24 * 60² * 1000
  var nextday=((jump-date.getDay())%7)
  var week=(nextday>=0)?0:7*86400000;
  return new Date(+date.getTime()+nextday*86400000+week);

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

   // console.log(Math.abs((Date.now()-shipping.when.getTime())/3600000))
   // console.log(new Date(),shipping.when)

  if(Math.abs((Date.now()-shipping.when.getTime())/3600000) < config.shop.order.timelimit){
    return callback("selected shipping day is to short.")    
  }
  //
  // get unique Order identifier
  db.model('Sequences').nextOrder(function(err,oid){
    if(err){
      callback(errorHelper(err));
      return;
    }
    //
    // get products by sku and check 
    var skus=_.collect(items,function(item){return item.sku});
    Products.findBySkus(skus).exec(function(err,products){
      assert(skus.length===products.length)
      // the unique identifier
      order.oid=oid;
      order.items=[];

      for (var i=0;i<items.length;i++) {
        var item=items[i], looperr;

        //
        // check an item
        Orders.checkItem(item,products[i],function(err,item){
          if(err){
            looperr=err;return
          }
          order.items.push(item)
        })

        //
        // manage err callback outside a checkItem
        if(looperr){
          return callback(looperr);
        }
      };

      //
      // adding customer email (check validity)
      if(!customer.email||customer.email.status!==true){
        return callback('valid email is required.')
      }
      order.customer=customer;
      order.email=customer.email.address;

      //
      // adding shipping address (minimum 3 fields 
      // for general error msg)
      if (!shipping||Object.keys(shipping).length<3){
        return callback('shipping address is required.')
      }
      order.shipping=shipping;

      //
      // adding payment
      order.payment={gateway:payment};

      //
      // ready to create one order
      var dborder =new  Orders(order);
      return dborder.save(function (err) {
        if(err) return callback(errorHelper(err));
        callback(null,dborder);
      });
    });
  

    
  });
  

}; 


Orders.set('autoIndex', config.mongo.ensureIndex);
exports.Orders = mongoose.model('Orders', Orders);


