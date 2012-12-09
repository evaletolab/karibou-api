
var debug = require('debug')('categories');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  


var Catalogs = new Schema({
    name: String
});

var Categories = new Schema({
    name: {type:String, unique:true},
    description:String
});


Categories.statics.create = function(names, callback){
  assert(names);
  debug("create catgories: "+names);
	var Categories=this.model('Categories');	
	
	//
	// case of cat array
	if(Array.isArray(names)){
	  var r=[];
    require('async').forEach(names, function(name,cb){
    	Categories.create(name,function(err,cat){
    	  cb(err);
    	  r.push(cat);
    	});      
    },function(err){
      callback(err,r);
    });	
    return;
	}

	//
	// create a Categories
  var c =new  Categories({name:names});   
  c.save(function (err) {
     callback(err,c);
  });  

}; 


Categories.statics.findByName = function(name, callback){
  return this.model('Categories').find({name:name}, function(e, cats){
    callback(e,cats);
  });
};
module.exports =mongoose.model('Categories', Categories);


