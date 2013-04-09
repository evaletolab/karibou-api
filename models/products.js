//
// refs:
// - http://kylebanker.com/blog/2010/04/30/mongodb-and-ecommerce/
// - http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

//
// have a look on docs/products-*.json for examples
//

var debug = require('debug')('products');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
  , ObjectId = Schema.Types.ObjectId;
  

var EnumOGM="Avec Sans".split(' ');
var EnumLocation=config.shop.product.location;

var Manufacturer = new Schema({
    name: {type:String, unique:true, required:true},
    description: String,
    location: {type:String, required:true,  enum:EnumLocation}
});






// Product Model

var Product = new Schema({
   sku: { type: Number, required: true, unique:true },
   title: { type: String, required: true },
   
   details:{
      description:{type:String, required:true},
      comment:{type:String, required:false},
      hasGluten:{type:Boolean, default:true}, 
      hasOgm:{type:Boolean, default:false},
      isBio:{type:Boolean, default:false}, 
      isBiodegradable:{type:Boolean, default:false}, 
   },  
   
   attributes:{
      isAvailable:{type:Boolean, default:true},
      hasComment:{type:Boolean, default:false}, 
      isDiscount:{type:Boolean, default:false}
   },

   pricing: {
      stock:{type:Number, min:0, requiered:true}, 
      price:{type:Number, min:0, requiered:true},
      discount:{type:Number, min:0, requiered:true},
   },

   image: {type:String},
   modified: { type: Date, default: Date.now },

   // Relations  (manufacturer should NOT BE MANDATORY)
   manufacturer:{type: Schema.Types.ObjectId, ref : 'Manufacturers'}, 
   categories: [{type: Schema.Types.ObjectId, ref : 'Categories'}],
   vendor:{type: Schema.Types.ObjectId, ref : 'Shops'}  
});


//
// validation
Product.path('title').validate(function (title) {
    return title.length > 10 && title.length < 70;
}, 'Product title should be between 10 and 70 characters');

Product.path('details.description').validate(function (v) {
    return v.length > 10;
}, 'Product description should be more than 10 characters');



//
// API

Manufacturer.statics.create=function(m,cb){
  var Manufacturer= this.model('Manufacturers');
  var maker=new Manufacturer(m);
  maker.save(function (err) {
    cb(err,maker);
  });
  return this;
};


//
// map an array of Values defined by the key to an array of Category.
// - throw an error if one element doesn't exist
Manufacturer.statics.map = function(values, callback){
  var db=this;  

  require('async').map(values, function(value,cb){
  
    if((typeof value)!=="object"){
      cb(new Error("find selector '"+value+"' is not typed Object as excpected"));
      return;
    }

  	db.model('Manufacturers').find(value,function(err,map){
  	  cb(err,map);
  	});      
  },function(err,maps){
    callback(err,maps);
  });	
};

Product.methods.addCategories=function(cats,callback){
  var p=this;
  if(Array.isArray(cats)){
    cats.forEach(function(cat){
      p.categories.push(cat);
    });
  }else{
    p.categories.push(cats);
  }
  p.save(function(err){
    if(err)callback(err);
  });
};

Product.methods.removeCategories=function(cats,callback){
  var p=this;
  if(Array.isArray(cats)){
    cats.forEach(function(cat){
      p.categories.pop(cat);
    });
  }else{
    p.categories.pop(cats);
  }
  p.save(function(err){
    if(err)callback(err);
  });
};


//
// create a new product 'p' for the shop 's'
Product.statics.create = function(p,s,callback){
  debug("create product: "+p);
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
      function(cb){
        //
        // set manufacturer 
        if(!p.manufacturer){
          cb(("manufacturer is missing"));
          return;
        }
        db.model('Manufacturers').findOne(p.manufacurer, function(err,m){
          p.manufacturer=m._id;
          cb(err);
        });
      },
      function(cb){
        //
        // set category (NOT MANDATORY)
        if(!p.categories){
          cb(("category is missing"))
          return;
        }
        db.model('Categories').map(p.categories, function(err,categories){
          
          p.categories=_.collect(categories,function(m){return m._id});;
          cb(err);
        });
      },
      function(cb){
        //
        // ready to create one product
        var product =new  Products(p);
        product.save(function (err) {
          cb(err,product);
        });

      }],
      function(err,product){
        callback(err,product);
      });
    
  });
  

}; 


Product.statics.findOneBySku = function(sku, callback){
  var cb=function(err, products){
    callback(err,products);
  };
  if (typeof callback !== 'function') {
    cb=undefined;
  }

  return this.model('Products').findOne({sku:sku}, cb);
};

Product.statics.findByCategory = function(cat, callback){
  // if cat is array
  if(Array.isArray(cat)){
    return callback(("[Array Categories] Not implemented yet!"));
  }
  if((typeof cat)==="string"){
//    this.model('Catgories').findByName(cat,function(e,c){
//    });
    return callback(("[String Categories] Not implemented yet!"));
  }
  
  // if cat is an Object
  var cb=function(err, products){
    callback(err,products);
  };
  if (typeof callback !== 'function') {
    cb=undefined;
  }
  
  return this.model('Products').find({categories:cat}, cb);
};

Product.statics.findByShop = function(shop, callback){
  var cb=function(err, products){
    callback(err,products);
  };
  if (typeof callback !== 'function') {
    cb=undefined;
  }
  
  
  return this.model('Products').find({vendor:shop._id}, cb);
};


exports.Products = mongoose.model('Products', Product);
exports.Manufacturers = mongoose.model('Manufacturers', Manufacturer);


