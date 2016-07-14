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
  , Orders = mongoose.model('Orders')
  , Schema = mongoose.Schema
  , cache = require("lru-cache")({maxAge:1000 * 60 * 60 * 24,max:50})
  , ObjectId = Schema.Types.ObjectId;
  

var EnumOGM="Avec Sans".split(' ');
var EnumLocation=config.shared.product.location;

var Manufacturer = new Schema({
    name: {type:String, unique:true, required:true},
    description: String,
    location: {type:String, required:true,  enum:EnumLocation}
});






// Product Model

var Product = new Schema({
   sku: { type: Number, required: true, unique:true, index: true },
   title: { type: String, required: true },
   slug: { type: String, required: false },
   
   details:{
      description:{type:String, required:true},
      comment:{type:String, required:false},
      origin:{type:String, required:false},
      lactose:{type:Boolean, default:false},       // lactose free
      gluten:{type:Boolean, default:false},        // Gluten free
      cold:{type:Boolean, default:false},          // Fresh food
      homemade:{type:Boolean, default:false},      // Home made
      natural:{type:Boolean, default:false},       // Synthetic Pesticide & Fertilizer Free
      local:{type:Boolean, default:false},         // Produit dans notre ferme
      bio:{type:Boolean, default:false},           // Certified Organic
      vegetarian:{type: Boolean,default:false},
      biodegradable:{type:Boolean, default:false}, //  
   },  
   
   attributes:{
      home:{type:Boolean, default:false, index: true},
      available:{type:Boolean, default:true},
      comment:{type:Boolean, default:false},
      discount:{type:Boolean, default:false, index: true}
   },

   quantity:{
      display:{type:Boolean, default:false},
      comment:String
   },

   shelflife:{
      display:{type:Boolean, default:false},
      comment:String
   },

   variants:[{
      title:String,
      short:String
   }],

   pricing: {
      stock:{type:Number, min:0, requiered:true, index: true}, 
      price:{type:Number, min:0, requiered:true},
      part:{type:String, requiered:true},
      discount:{type:Number, min:0, requiered:true},
   },

   photo:{
    url:{type:String}
  },

  //
  // answer question about your product
  faq:[{
    q:{type: String, required: true},
    a:{type: String, required: true},
    updated:{type:Date, default: Date.now}
  }],


  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },

   // Relations  (manufacturer should NOT BE MANDATORY)
   manufacturer:{type: Schema.Types.ObjectId, ref : 'Manufacturers'}, 
   categories:{type: Schema.Types.ObjectId, ref : 'Categories' , requiered:true},
   vendor:{type: Schema.Types.ObjectId, ref : 'Shops', requiered:true, index:true}  
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



//db.userSchema.update({"username" : USERNAME}, { "$addToSet" : { "followers" : ObjectId}})
/** NO MORE AVAILABE
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

*/



Product.post('save',function (product) {
  cache.reset();
});

Product.post('remove',function (product) {
  //
  // clean likes for all users
  cache.reset();

  db.model('Users').find({'likes':product.sku}).exec(function (err,users) {
    users.forEach(function (user) {
      user.removeLikes(product.sku)
    })
  })
})

Product.on('index', function(err,o) {
});

Product.methods.getPrice=function(){
  if(this.attributes.discount && this.pricing.discount)
    return this.pricing.discount;
  return this.pricing.price;
};

//
// list changed fields  
Product.methods.getDiff=function (next) {
  var self=this.toObject(),result={
    details:{},
    attributes:{},
    pricing:{}
  };

  //
  // check new instance
  if(!next){
    result={
      details:this.details,
      attributes:this.attributes,
      pricing:this.pricing
    };    
    return result;
  }

  // human content
  result.title=next.title;

  //
  // log diff of details
  Object.keys(self.details).forEach(function (detail) {
    if(self.details&&self.details[detail]!==next.details[detail]){
      result.details[detail]=next.details[detail];
    }
  });

  //
  // log diff of attributes
  Object.keys(self.attributes).forEach(function (attribute) {
    if(self.attributes&&
       self.attributes[attribute]!==next.attributes[attribute]){
      result.attributes[attribute]=next.attributes[attribute];
    }
  });

  //
  // log diff of pricing
  Object.keys(self.pricing).forEach(function (price) {
    if(self.pricing&&
       self.pricing[price]!==next.pricing[price]){
      result.pricing[price]=next.pricing[price];
    }
  });


  return result;
}
//
// product is available for order only if
// - vendor is populated,
// - attributes.available is true
// - vendor.status is true
// - vendor.available.active is true
Product.methods.isAvailableForOrder=function(){
  if(!this.vendor||!this.vendor._id){
    // vendor must be populated
    return false;
  }
  return (this.attributes.available && 
          this.vendor.status===true &&
          !this.vendor.available.active)
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
    p.vendor=(s._id)?s._id:s;
    

    //
    // set category (NOT MANDATORY)
    if(!p.categories){          
      return callback("Il manque la catégorie");
    }
    if(Array.isArray(p.categories)){
      return callback("la catégorie doit être unique");
    }

    if(!p.categories._id)p.categories={_id:p.categories}

    db.model('Categories').findOne(p.categories,function(err,categories){
      if(err){
        return callback(err);
      }  

      p.categories=categories;        
 
      //
      // slug this product
      if(!p.slug&&p.title){
        p.slug=p.title.slug();
      }
      

      //
      // ready to create one product
      var product =new  Products(p);
 
      product.save(function (err) {
        if(err){
          return callback(err)
        }

        cache.reset();

        Products.findOne({_id:product._id})
               .populate('vendor')
               .populate('categories').exec(callback)

      });

    })

  });
  

}; 



/**
 * find popular products (by user or for all)
 *   - windowtime (def 4 month), considering a lasped time to compute popular sku
 *   - email, constrain popular to one user
 *   - maxcat (def 4), constrain a maximum sku by category 
 *   - likes, a list of product to append
 *   - available (def true), product must be available for order
 */
Product.statics.findPopular = function(criteria, callback){
  assert(criteria);

  var promise = new mongoose.Promise, cacheKey=JSON.stringify(criteria);
  if(callback){promise.addBack(callback);}

  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }


  var skus=[], 
      today=new Date(), 
      windowtime=new Date(Date.now()-86400000*30*parseInt(criteria.windowtime||2)), 
      thisYear=today.getFullYear(),
      thisMonth=today.getMonth(),
      maxcat=criteria.maxcat||4;


  // constrain popular to a single user
  var select={ 
    $or:[{'payment.status': 'paid'},{'payment.status': 'invoice'}],
    'shipping.when':{$gte:windowtime}
  };
  if(criteria.email){
    select.email=criteria.email;
  }

  if(thisMonth<windowtime){
    thisYear={$in:[thisYear,thisYear-1]};
  }

  // TODO move this function to order API
  // get items last 3 month sku by 
  this.model('Orders').aggregate(
     { $match: select },
     {$project:{month: { $month: "$shipping.when"}, year: { $year: "$shipping.when" },
         items:1,
     }},
     { $match: { 'month': {$gt:today.getMonth()-windowtime,$lte:today.getMonth()+1 }, 'year':thisYear } },     
     {$unwind: '$items' },
     {$group:
         {
           _id:"$items.sku",
           category:{"$first":"$items.category"},
           title:{"$first":"$items.title"},
           month:{"$first":"$month"},
           hit: { $sum: 1 }
         }
     },
     {$group:{
        _id:"$category",
        contains:{$addToSet:{sku:"$_id",title:"$title",hit:"$hit"}},
        nb:{$sum:1}
     }},
     // {$unwind: '$contains' },
     {$sort:{'_id':1,'contains.hit':1}},
  function (err, result) {
    if(err){return promise.reject(err);}


    if(result&&result.length){
      // iterate on category
      result.forEach(function (category) {
        // sort 
        category.contains.sort(function(a,b) {
          if(a.hit>b.hit) return -1;
          if(a.hit<b.hit) return 1;
          return 0;
        }).every(function (item, i) {
          // console.log(category._id, item.sku,item.hit,i)
          skus.push(item.sku);
          if((i)>=(maxcat-1)) return false;
          return true;
        })
      })
    }

    //
    // append likes
    if(criteria.likes&&criteria.likes.length){
      criteria.likes.forEach(function (item) {
        skus.push(item)
      })
    }

    //
    // get products
    var filters={
      skus:skus
    };
    if(criteria.available){
      filters.status=true;
      filters.available=true;
      filters.instock=true;
      filters.when=criteria.when;
    }
    if(criteria.discount){
      filters.discount=true;
    }

    var query=mongoose.model('Products').findByCriteria(filters,function (err, products) {
      if(err){
        return promise.reject(err);
      }
      cache.set(cacheKey,products);
      promise.resolve(null,products);
    });
  })
  return promise; 
};


//
// get a list of discount sku
// we collect only SKU to makes the api fast
Product.statics.findDiscountSKUs=function(callback) {
  var promise = new mongoose.Promise, cacheKey=JSON.stringify("discount");
  if(callback){promise.addBack(callback);}

  //

  // already in cache?
  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }


  var query=this.model('Products').find({});
  query=query.where("attributes.discount",true);      
  query=query.where("attributes.available",true);
  query=query.where("pricing.stock").gt(0);
  query.select('sku -_id').sort('-update').limit(20).exec(function (err,products) {
    products=products.map(function(product) {
      return product.sku;
    });
    cache.set(cacheKey,products);
    promise.resolve(err,products);
  });


  return promise;
}


Product.statics.findBySkus = function(skus, callback){
  // var promise = new mongoose.Promise;
  // if(callback){promise.addBack(callback);}

  var query=this.model('Products').find({sku:{
    $in:skus,
  }}).populate('vendor')
     .populate('categories')
     .populate({path:'categories',select:'weight name'});

  //
  // only available products ?
  // query=query.where("pricing.stock").gt(0).where("attributes.available",true);

  // query.exec(function(err,prods) {
  //   promise.resolve(err,prods);
  // });

  if(callback){
    return query.exec(callback);
  }

  return query;

};

Product.statics.findOneBySku = function(sku, callback){
  var cb=function(err, products){
    callback(err,products);
  };
  if (typeof callback !== 'function') {
    cb=undefined;
  }

  return this.model('Products').findOne({sku:sku})
           .populate('vendor')
           .populate('categories')
           .populate({path:'categories',select:'weight name'}).exec(cb);
};



/**
 * available criterias{
 *   shopname:slug,
 *   category:slug,
 *   details:details
 *   valid:true|false,
 *   available:true|false // match product.attributes.available
 *   status:true|false // match shop status within the week of orders (TODO testit more!)
 *   sort:----
 * }
 */
Product.statics.findByCriteria = function(criteria, callback){
  var Products=this.model('Products'), 
      Categories=this.model('Categories'),
      Shops=this.model('Shops');

  var promise = new mongoose.Promise, cacheKey=JSON.stringify(criteria);
  if(callback){promise.addBack(callback);}
      

  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }

      
  var query=Products.find({})
              .populate(['vendor','vendor.owner','categories']),
      available=false,
      shop=false,
      category=false;
  
  var now=Date.now();

  
  //
  // by available shops status could be a boolean or a lst of shop
  (function () {
    var promiseStatus= new mongoose.Promise;
    if (!criteria.status){
      return promiseStatus.resolve(null,false);
    }

    //
    // specify full shipping week 
    var nextShippingDays=Date.fullWeekShippingDays(8);
    // specify a custom date
    if(criteria.when){
      nextShippingDays=[new Date(criteria.when)];
    }

    Shops.findAvailable(nextShippingDays).then(function(available) {
      // les-potagers-de-gaia 547836ee8b8cf18304bbbe15
      // sandrine-guy-producteurs 547cd1428b8cf18304bbbe35
      available=available.map(function (a) {
        return a._id;
      });
      if (Array.isArray(criteria.status)){
        criteria.status.forEach(function(s){
          available.push(s._id);
        });
        console.log('FIXME ---------------> criteria.status')
      }
      promiseStatus.resolve(null,available)
    });
    return promiseStatus;
  })().then(function (available) {
    var promiseShop= new mongoose.Promise;

    //
    // by shop
    if (!criteria.shopname){        
      return promiseShop.resolve(null,available, false);
    }

    Shops.findOne({urlpath:criteria.shopname},function(err,shop){
      if(!shop){
        return promiseShop.reject(new Error("La boutique n'existe pas"))
      }
      promiseShop.resolve(err,available, shop);
    });

    return promiseShop;
  }).then(function (available, shop) {
    var promiseCategory= new mongoose.Promise;

    //
    // by category
    if (!criteria.category){
      return promiseCategory.resolve(null,available, shop,false)
    }
    Categories.findOne({slug:criteria.category},function(err,category){
      if(!category){
        return promiseCategory.reject(new Error("La catégorie n'existe pas"));
      }
      promiseCategory.resolve(err,available, shop,category);
    });
    return promiseCategory;
  }).then(function (available, shop, category) {
  

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
    if(shop&&available&&(_.find(available,function(s){return shop._id.equals(s)}))){        
      query=query.where("vendor",shop._id);
    }else 
    
    //
    // shop && available && !available.find(shop._id)
    if(shop&&available){
      return promise.resolve(null,[]);
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

    //
    // with discount
    if(criteria.discount!==undefined){
      query=query.where("attributes.discount",criteria.discount);      
    }

    //
    // only available products ?
    if(criteria.available!==undefined){
      query=query.where("attributes.available",(criteria.available));
    }

    //
    // only available products ?
    if(criteria.instock!==undefined){
      query=query.where("pricing.stock").gt(0);
    }

    //
    // only low stock products ?
    if(criteria.lowstock!==undefined){
      query=query.where("pricing.stock").lt(5);
    }

    //
    // filter by SKUs
    if(criteria.skus){
      query=query.where("sku").in(criteria.skus)
    }

    //
    // available at home ?
    if(criteria.home!==undefined){
      query=query.where("attributes.home",(criteria.home));
    }
     
    // console.log('---------- 3 exec', Date.now()-now)

    query.populate('vendor')
           .populate('categories')
           .populate({path:'categories',select:'weight name'}).exec(function (err,products) {
            // console.log('---------- 4 exec', Date.now()-now,products.length)
             cache.set(cacheKey,products);
             promise.resolve(err,products);
           });

  }).then(undefined,function (error) {
    //
    // ON ERROR
    //
    promise.reject(error);
  })

  return promise;

};

//
// update shop content
// Product.statics.update=function(id,p,callback){
// 	var Products=this.model('Products');	
	
// 	if (!Object.keys(id).length) return callback("You have to define one product for update");

//   //findOneAndUpdate(conditions, update) 
//   return Products.findOne(id).populate('vendor').exec(function (err, product) {
//     //
//     // other fields are not managed by update
//     //console.log(product)
//     if (!product){
//       return callback("Could not find product for update "+JSON.stringify(id))
//     }
//     _.extend(product,s);

 
//     return product.save(function (err) {
//       return callback(err,product);
//     });
//   });
// };

Product.set('autoIndex', config.mongo.ensureIndex);
exports.Products = mongoose.model('Products', Product);
exports.Manufacturers = mongoose.model('Manufacturers', Manufacturer);


