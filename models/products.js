//
// refs:
// - http://kylebanker.com/blog/2010/04/30/mongodb-and-ecommerce/
// - http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

//
// have a look on docs/products-*.json for examples
//

var debug = require('debug')('products');

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
   },  
   
   attributes:{
        isAvailable:{type:Boolean, default:true},
        hasGluten:Boolean, 
        hasComment:Boolean, 
        hasOgm:Boolean,
        stock:Number, 
        isBio:Boolean, 
        isPromote:Boolean
   },

   manufacturer:[Manufacturer],
   image: {type:String},
   categories: [Categories],
   catalogs: [Catalogs],
   vendor:[{type: Schema.ObjectId, ref : 'Shops'}],  
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

Product.statics.create = function(product,callback){
  debug("create product: "+product);
  
  
	var Products=this.model('Products');
  var product =new  Products(product);

  //TODO findNextSKU
  this.model('Sequences').nextSku(function(err,sku){
    if(err)callback(err);
    
    product.sku=seq;
    
    product.save(function (err) {
      debug("created product, error: "+err);
      debug("created product, product: "+product);
      callback(err,product);
    });
  });
  

}; 

Product.statics.findBySku = function(sku, callback){
	var Products=this.model('Products');
  Products.findOne({sku:sku}, function(e, product){
    callback(e,product);
  });
};

Product.statics.findByCategory = function(category, success, fail){
	var Products=this.model('Products');
  Products.find({categories:category}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
};

Product.statics.findByVendor = function(shop, success, fail){
	var Products=this.model('Products');
  Products.find({vendor:shop}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
};


module.exports = mongoose.model('Products', Product);


