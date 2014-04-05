
var debug = require('debug')('categories');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  


var Categories = new Schema({
    name: {type:String, unique:true, index:true},
    slug: {type:String, unique:true, index:true},
    description:{type:String, unique:false},
    weight:{type:Number, min:0},
    group:{type:String, unique:false},
    image:{type:String, unique:false},
    color:{type:String, unique:false},    
    weight:{type:Number, min:0},    
    type:{type:String, unique:false, default:"Category",enum:config.shop.category.types}
});


Categories.methods.slugName=function(){
  return this.name.slug();
};


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
  c.save(function (err) {
     callback(err,c);
  });  

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
Categories.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Categories', Categories);


