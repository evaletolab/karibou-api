//
// refs:
// - http://kylebanker.com/blog/2010/04/30/mongodb-and-ecommerce/
// - http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

//
// have a look on docs/products-*.json for examples
//

var debug = require('debug')('products');
var assert = require("assert");


var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  

 var EnumOGM="Avec Sans".split(' ');


var Manufacturer = new Schema({
    name: String,
    region: {type:String}
});



var Categories = new Schema({
    name: String
});



var Catalogs = new Schema({
    name: String
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
      isBio:{type:Boolean, default:true}, 
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
   
   manufacturer:[Manufacturer],
   image: {type:String},
   categories: [Categories],
   catalogs: [Catalogs],
   vendor:{type: Schema.ObjectId, ref : 'Shops'},  
   modified: { type: Date, default: Date.now }
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

Product.statics.create = function(p,s,callback){
  debug("create product: "+product);
  assert(p);
  assert(s);
  assert(callback);
  
	var Products=this.model('Products');
  var product =new  Products(p);

  //TODO findNextSKU
  this.model('Sequences').nextSku(function(err,sku){
    if(err)callback(err);
    
    product.sku=sku;
    
    //
    //associate product and shop
    product.vendor=s;
    product.save(function (err) {
      debug("created product, error: "+err);
      debug("created product, product: "+product);
      callback(err,product);
    });
  });
  

}; 

Product.statics.findOneBySku = function(sku, callback){
	var Products=this.model('Products');
  Products.findOne({sku:sku}, function(e, product){
    callback(e,product);
  });
};

Product.statics.findByCategory = function(category, callback){
  var Products=this.model('Products');
  Products.find({categories:category}, function(err, product){
    callback(err,product);
  });
};

Product.statics.findByShop = function(shop, callback){
	var Products=this.model('Products');
  Products.find({vendor:shop}, function(err, products){
    callback(err,products);
  });
};


module.exports = mongoose.model('Products', Product);


