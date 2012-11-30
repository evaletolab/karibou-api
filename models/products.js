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

var Shops = new Schema({
    url:{ type: String, required: true, unique:true },
    name: { type: String, required: true },
    description:{ type: String, required: true },
    bg:{ type: String, required: true },
    user:[{type: Schema.ObjectId, ref : 'Users'}]
});

var Sequences = new Schema({
    name:String,
    seq:{type:Number,min:100000, default:100000}
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
// SEQUENCES API

Sequences.statics.next = function(name, callback){
  	var Sequences=this.model('Sequences');
  	var newSeq;
  	Sequences.findOne({name:name}, function(err, n){
  	  if (!n){
    	  n=new Sequences({name:name});
    	  n.save(function(err){
          debug("get next sequence ("+name+":"+n.seq+") err:"+err );
      	  callback(err,n.seq);
    	  });
  	  }else{

  	    n.update({$inc: {seq:1}}, { safe: true }, function(err,inc){
            debug("get next sequence ("+name+":"+n.seq+inc+") err:"+err );
         	  callback(err,n.seq+inc);
  	    });
  	  }
  	});  	  	
}; 

// simple wrapper for SKU
Sequences.statics.nextSku = function( callback){
  this.model('Sequences').next("sku",callback);
};


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

mongoose.model('Sequences', Sequences);
module.exports = mongoose.model('Products', Product);


