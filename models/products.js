//
// refs:
// - http://kylebanker.com/blog/2010/04/30/mongodb-and-ecommerce/
// - http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

//
// have a look on docs/products-*.json for examples
//


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

var Shops = new Schema({
    url:{ type: String, required: true, unique:true },
    name: { type: String, required: true },
    description:{ type: String, required: true },
    bg:{ type: String, required: true },
    user:[{type: Schema.ObjectId, ref : 'Users'}]
});

var Skus = new Schema({
    stamp:{type:Number,min:1000,unique:true}
});

// Product Model

var Product = new Schema({
   sku: { type: String, required: true, unique:true },
   title: { type: String, required: true },
   details:{
     description:{type:String, required:true},
     remarque:{type:String, required:false},
   },  
   attributs:{available:{type:Boolean, default:true},stock:Number, bio:Boolean, promote:Boolean, ogm:{type:String, enum:EnumOGM}},

   manufacturer:[Manufacturer],
   image: {type:String},
   categories: [Categories],
   catalogs: [Catalogs],
   vendor: [Shops],
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
Product.statics.findBySku = function(sku, success, fail){
	var Products=this.model('Products');
  Products.findOne({sku:sku}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
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


