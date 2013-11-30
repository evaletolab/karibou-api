

var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
  , ObjectId = Schema.Types.ObjectId;
  

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
   email:{type: String},
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
      vendor:{
        ref:{type: Schema.Types.ObjectId, ref : 'Shops', requiered:true},
        slug:{type:String, required:true},
        name:{type:String, required:true},
        fullName:{type:String, required:true},
        address:{type:String, required:true},
      },
      quantity:{type:Number, min:1, max:100, requiered:true}, 


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
      
      // given price
      price:{type:Number, min:0, max:2000, requiered:true},      
      // real price, maximum +/- 10% of given price 
      finalprice:{type:Number, min:0, max:1000, requiered:true},
      // customer note
      note:{type:String, required:false}, 
      
   }],
   
   
   shipping:{
      when:{type:Date, required:true},
      address:{type:String,required:true},
      fullName:{type:String, required:true},
      postal:{type:String, required:true},
      code:{type:String, required:true},
      floor:{type:String, required:true}
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

  assert(product)
  assert(quantity)
  assert(product.vendor)
  // check(product.attributes.available)

  keys.forEach(function(key){
    copy[key]=product[key];    
  })

  copy.quantity=quantity;
  copy.price=(product.pricing.discount)?product.pricing.discount*quantity:product.pricing.price*quantity
  copy.note=note;
  copy.finalprice=copy.price;
  return copy;
}

//
// check item
Orders.statics.checkItem=function(item, product, cb){
  var msg1="Ooops, votre article est incomplet. Les données de votre panier ne sont plus valables "
    , msg2="Votre produit n'est malheureusement plus disponible "
    , msg3="Le prix de votre produit a été modifié par le vendeur ";

  assert(item.sku==product.sku)

  //
  // check item and product exists
  if(!item || !product){
    return cb(msg1)
  }

  //
  // check item.categories
  if(!item.category){
    item.category=product.categories[0].name
  }

  //
  // check item.vendor
  if(!item.vendor ){
    return cb(msg1)
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

  //
  // check item is still available in stock
  if(item.quantity>product.pricing.stock){
    return cb(msg2)
  }

  //
  // check item is correct
  // Math.round(value*100)/100
  var price=(product.pricing.discount)?product.pricing.discount*item.quantity:product.pricing.price*item.quantity
  if(item.price.toFixed(1)!=price.toFixed(1)){
    return cb(msg3)
  }


  return cb(null,item)

  // mongoose.model('Products').findOneBySku(item.sku,function(err,product){    
  // })

}

//db.userSchema.update({"username" : USERNAME}, { "$addToSet" : { "followers" : ObjectId}})


//
Orders.statics.create = function(items, customer, shipping, callback){
  assert(items);
  assert(items.length);
  assert(customer);
  assert(shipping);
  assert(callback);
  var db=this
    , Orders=db.model('Orders')
    , Products=db.model('Products')
    , order={};



  //
  // get unique Order identifier
  db.model('Sequences').nextOrder(function(err,oid){
    if(err){
      callback(err);
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
      // ready to create one order
      var dborder =new  Orders(order);
      return dborder.save(function (err) {
        callback(err,dborder);
      });
    });
  

    
  });
  

}; 


Orders.set('autoIndex', config.mongo.ensureIndex);
exports.Orders = mongoose.model('Orders', Orders);


