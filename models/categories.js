
var debug = require('debug')('categories');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
  , ObjectId = Schema.ObjectId;
  


var Catalogs = new Schema({
    name: String
});

var EnumCategories="Category Catalog".split(' ');

var Categories = new Schema({
    name: {type:String, unique:true},
    description:{type:String, unique:false},
    type:{type:String, unique:false, default:"Category",enum:EnumCategories}
});


Categories.statics.create = function(names, callback){
  assert(names);
  debug("create catgories: "+names);
	var Categories=this.model('Categories');	
	
	//
	// manage batch creation
	if(Array.isArray(names)){
    var r=[];require('async').forEach(names, function(name,cb){
    	Categories.create(name,function(err,cat){
    	  r.push(cat);
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
	var cat=((typeof names) ==="string")?({name:names}):(names);
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
      cb(new Error("find selector '"+value+"' is not typed Object as excpected"));
      return;
    }
  	db.model('Categories').findOne(value,function(err,cat){
   	  if (!cat){
  	    err=new Error("The category '"+JSON.stringify(value)+"' doesn't exist");
  	  }
  	  cb(err,cat);
  	  //console.log(cat)
  	});      
  },function(err,r){
    callback(err,r);
  });	


};



Categories.statics.findByName = function(n, callback){
  return this.model('Categories').find({name:n}, function(e, cats){
    callback(e,cats);
  });
};
module.exports =mongoose.model('Categories', Categories);


