
var debug = require('debug')('categories');
var assert = require("assert");

var mongoose = require('mongoose')
  , cache = require("lru-cache")({maxAge:1000 * 60 * 60 * 12,max:50})
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  


var Categories = new Schema({
    name: {type:String, unique:true, index:true},
    slug: {type:String, unique:true, index:true},
    description:{type:String},
    weight:{type:Number, min:0},
    group:{type:String},
    image:{type:String},
    cover:{type:String},
    color:{type:String},    
    active:{type:Boolean, default:true},    
    home:{type:Boolean, default:false},    
    weight:{type:Number, min:0},    
    type:{type:String, default:"Category",enum:config.shared.category.types}
});

Categories.post('save',function (product) {
  cache.reset();
});

Categories.post('remove',function (product) {
  cache.reset();
});

Categories.methods.slugName=function(){
  return this.name.slug();
};

Categories.statics.removeBySlug=function (slug,callback) {
  var promise = new mongoose.Promise, Categories=this;
  if(callback){promise.addBack(callback);}

  // check if there is products associated
  db.model('Products').find({"categories.slug":slug}).exec().then(function (prods) {
    if(prods.length){
      return promise.reject(new Error("Impossible de supprimer une categorie associée."));
    }
    return Categories.remove({slug:slug});
  }).then(function() {
    cache.reset();
    promise.resolve();
  }).then(undefined,function(err) {
    // on error!
    promise.reject(err);
  });

  return promise;
}


Categories.statics.create = function(cats, callback){
  assert(cats);
	var Categories=this.model('Categories');	
	
	//
	// manage batch creation
	if(Array.isArray(cats)){
    var r=[];require('async').forEach(cats, function(cat,cb){
    	Categories.create(cat,function(err,c){
    	  r.push(c);
    	  cb(err);
    	});      
    },function(err){
      callback(err,r);
    });
    // end of array	
    return;
	}

	//
	// create one Category
	var cat=((typeof cats) ==="string")?({name:cats}):(cats);
	cat.slug=cat.name.slug();
  var c =new  Categories(cat);   
  c.save(callback);  

}; 

//
// map an array of Values defined by the key to an array of Category.
// - throw an error if one element doesn't exist
Categories.statics.map = function(values, callback){
  var db=this;

  require('async').map(values, function(value,cb){
    if((typeof value)!=="object"){
      //
      // reformat selector, as the default field name is _id
      value={_id:value};
    }
  	db.model('Categories').findOne(value,function(err,cat){
   	  if (!cat){
  	    err=("La catégorie '"+JSON.stringify(value)+"' n'existe pas!");
  	  }
  	  cb(err,cat);
  	  //console.log(cat)
  	});      
  },function(err,r){
    callback(err,r);
  });	


};

Categories.statics.findBySlug = function(name, callback){
  return this.model('Categories').findOne({slug:name}, function(e, cat){
    callback(e,cat);
  });
};


Categories.statics.findByName = function(n, callback){
  return this.model('Categories').findOne({name:n}, function(e, cat){
    callback(e,cat);
  });
};



Categories.statics.findByCriteria=function (criteria,callback) {
  var promise = new mongoose.Promise, cacheKey=JSON.stringify(criteria), 
      Categories=this;
  if(callback){promise.addBack(callback);}
      
  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }

  //
  // initial find
  var type=(criteria.type)?{type:criteria.type}:{};
  var query=Categories.find(type);



  //
  // count sku by category
  if (criteria.stats){
    var stats=db.model('Products').aggregate(
      {$project : { sku : 1, categories : 1 }},
      {
        $group:{
          _id:"$categories", 
          sku:{$addToSet:"$sku"}
        }
    });
  }
  //
  // filter by group name
  if (criteria.group){
    query=query.where("group",new RegExp(criteria.group, "i"))
  }
  
  //
  // filter by name
  if (criteria.name){
    query=query.where("name",new RegExp(criteria.name, "i"))
  }
  
  query.exec(function(err,cats){
    if(err){
      return promise.reject(err);
    }

    //
    // return categories
    if (!stats){
      cache.set(cacheKey,cats);
     return promise.resolve(null,cats);
    }


    //
    // merge aggregate with categories to obtains :
    // the products by category
    stats.exec(function(err,result){
      if(err){
        return promise.reject(err);
      }
      cats.forEach(function(cat){
        var stat=_.find(result,function(s){return s._id&&s._id.toString()==cat._id.toString()});          
        cat._doc.usedBy=(stat)?stat.sku:[];
      });
      cache.set(cacheKey,cats);
      return promise.resolve(null,cats);
    });
    
  });

  return promise;

}

Categories.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Categories', Categories);


