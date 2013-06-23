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
      origin:{type:String, required:false},
      gluten:{type:Boolean, default:false}, 
      ogm:{type:Boolean, default:false},
      lactose:{type:Boolean, default:false},
      local:{type:Boolean, default:false},
      bio:{type:Boolean, default:false}, 
      biodegradable:{type:Boolean, default:false}, 
   },  
   
   attributes:{
      available:{type:Boolean, default:true},
      comment:{type:Boolean, default:false}, 
      discount:{type:Boolean, default:false}
   },

   pricing: {
      stock:{type:Number, min:0, requiered:true}, 
      price:{type:Number, min:0, requiered:true},
      part:{type:String, requiered:true},
      discount:{type:Number, min:0, requiered:true},
   },

   photo: {type:String},
   created: { type: Date, default: Date.now },

   // Relations  (manufacturer should NOT BE MANDATORY)
   manufacturer:{type: Schema.Types.ObjectId, ref : 'Manufacturers'}, 
   categories: [{type: Schema.Types.ObjectId, ref : 'Categories' , requiered:true}],
   vendor:{type: Schema.Types.ObjectId, ref : 'Shops', requiered:true}  
});




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
      //
      // reformat selector, as the default field name is _id
      value={_id:value};
    }

  	db.model('Manufacturers').find(value,function(err,map){
  	  cb(err,map);
  	});      
  },function(err,maps){
    callback(err,maps);
  });	
};

//db.userSchema.update({"username" : USERNAME}, { "$addToSet" : { "followers" : ObjectId}})
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


Product.statics.findOneBySku = function(sku, callback){
  var cb=function(err, products){
    callback(err,products);
  };
  if (typeof callback !== 'function') {
    cb=undefined;
  }

  return this.model('Products').findOne({sku:sku}).populate('vendor').exec(cb);
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
Product.statics.findByCriteria = function(criteria, callback){
  var Products=this.model('Products'), 
      Categories=this.model('Categories'),
      Shops=this.model('Shops');
      
      
  var query=Products.find({});
  

  //console.log(criteria)
  
  require('async').waterfall([
    function(cb){
      //
      // by available shops
      if (criteria.status){
        Shops.find({status:true},function(err,available){
          if (Array.isArray(criteria.status)){
            criteria.status.forEach(function(s){
              available.push(s._id)
            })            
          }
          return cb(err,available);
        });
      }else cb(false,false);
    },

    function(available, cb){
      //
      // by shop
      if (criteria.shopname){        
        Shops.findOne({urlpath:criteria.shopname},function(err,shop){
          if(!shop){return cb("La boutique n'existe pas");}
          return cb(err,available, shop);
        });
      }else cb(false,available, false);
    },
    function(available, shop, cb){
      //
      // by category
      if (criteria.category){
        Categories.findOne({slug:criteria.category},function(err,category){
          if(!category){return cb("La catégorie n'existe pas");}
          return cb(err,available, shop,category);
        });
      }else cb(false,available, shop,false);
    }],
    function(err,available, shop, category){
      if(err) return callback(err);


      //
      // !shop && available
      if (available &&!shop){
        query=query.where("vendor").in(available);
      }else

      //
      // shop && !available
      if(shop&&!available){
        query=query.where("vendor",shop._id);
      }else
      
      //
      // shop && available && available.find(shop._id)
      if(shop&&available&&(_.find(available,function(s){return shop._id.equals(s._id)}))){        
        query=query.where("vendor",shop._id);
      }else 
      
      //
      // shop && available && !available.find(shop._id)
      if(shop&&available){
        return query.where("status",'abcd01234').exec(callback);
        //return callback(false,[])
      }
      

      //
      // filter by Category ID
      if(category){
        query=query.where("categories",category._id);
      }  

      //
      // filter by geo location 
      if (criteria.location){
      }
      
      //
      // filter by details
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
Product.statics.update=function(id,p,callback){
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

Product.set('autoIndex', config.mongo.ensureIndex);
exports.Products = mongoose.model('Products', Product);
exports.Manufacturers = mongoose.model('Manufacturers', Manufacturer);


