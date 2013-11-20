

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
   ac: { type: Number, required: true, unique:true },
   
   /* customer email */
   email:{type: String},
   created:{type: Date, default: Date.now },
   closed:{type: Date, default: Date.now },
   
   /* full customer details */
   customer:{type: Schema.Types.Mixed, required:true},
   
   /* order canceled reason and dates */
   cancel:{
      reason:{type:String, enum:EnumCancelReason},
      when:{type: Date},
   }
   
   /* discount_code:{type: String}, */   
   /* cart_token:{type: String}, */
   
   financial_status:{type:String, enum:EnumFinancialStatus},

   fulfillments:{
     status:{type: String, required: true, enum: EnumOrderStatus, default:'created'},     
   },

   items:[{
      sku:{type:Number, min:10000, requiered:true}, 
      name:{type:String, required:true},
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
      address:{type:String,required:true}
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

//db.userSchema.update({"username" : USERNAME}, { "$addToSet" : { "followers" : ObjectId}})


//
Orders.statics.create = function(p,s,callback){
  assert(p);
  assert(s);
  assert(callback);
  var db=this;
  var Products=this.model('Products');


  //TODO findNextSKU
  this.model('Sequences').nextSku(function(err,sku){
    if(err){
      callback(err);
      return;
    }
    
    // the unique identifier
    p.sku=sku;
        
    //associate product and shop
    p.vendor=s;
    
    require('async').waterfall([
    /*
      function(cb){
        //
        // set manufacturer , not currently needed
        if(!p.manufacturer){
          cb(("manufacturer is missing"));
          return;
        }
        db.model('Manufacturers').findOne(p.manufacurer, function(err,m){
          p.manufacturer=m._id;
          cb(err);
        });
      },
      */
      function(cb){
        //
        // set category (NOT MANDATORY)
        if(!p.categories||!p.categories.length){
          cb("Il manque la catégorie")
          return;
        }
        db.model('Categories').map(p.categories, function(err,categories){
          // FIXME
          //check category is well typed 'category'
          if(err){
            return cb(err);
          }
          p.categories=_.collect(categories,function(m){return m._id});;
          cb();
        });
      }],
      function(err){
        if (err){
          return callback(err);
        }
        //
        // ready to create one product
        var product =new  Products(p);
        product.save(function (err) {
          callback(err,product);
        });
      });
  });
  

}; 


/**
 * available criterias{
 *   shopname:slug,
 *   category:slug,
 *   details:details
 *   valid:true|false,
 *   sort:----
 * }
 */
Orders.statics.findByCriteria = function(criteria, callback){
  var Products=this.model('Products'), 
      Categories=this.model('Categories'),
      Shops=this.model('Shops');
  var query=Products.find({});
  require('async').waterfall([
    function(cb){
      if (criteria.shopname){
        Shops.findOne({urlpath:criteria.shopname},function(err,shop){
          if(!shop){return cb("La boutique n'existe pas");}
          return cb(err,shop);
        });
      }else cb(false,false);
    },
    function(shop, cb){
      if (criteria.category){
        Categories.findOne({slug:criteria.category},function(err,category){
          if(!category){return cb("La catégorie n'existe pas");}
          return cb(err,shop,category);
        });
      }else cb(false,shop,false);
    }],
    function(err,shop, category){
      if(err) return callback(err);
      if(shop){
        query=query.where("vendor",shop._id);
      }  
      if(category){
        query=query.where("categories",category._id);
      }  

      if (criteria.location){
      }
      if (criteria.details){
        var details=criteria.details.split(/[+,]/);
        details.forEach(function(detail){
          query=query.where("details."+detail,true);
        });        
      }
      if(callback){
        return query.populate('vendor').exec(callback);
      }
    }
  );

  return query;

};

//
// update shop content
Orders.statics.update=function(id,p,callback){
  var Products=this.model('Products');  
  
  if (!Object.keys(id).length) return callback("You have to define one product for update");

  //findOneAndUpdate(conditions, update) 
  return Products.findOne(id).populate('vendor').exec(function (err, product) {
    //
    // other fields are not managed by update
    //console.log(product)
    if (!product){
      return callback("Could not find product for update "+JSON.stringify(id))
    }
    extend(product,s);
    console.log(s)

 
    return product.save(function (err) {
      return callback(err,product);
    });
  });
};

Orders.set('autoIndex', config.mongo.ensureIndex);
exports.Orders = mongoose.model('Orders', Orders);


