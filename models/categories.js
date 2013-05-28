
var debug = require('debug')('categories');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
  , ObjectId = Schema.ObjectId;
  


var Categories = new Schema({
    name: {type:String, unique:true, index:true},
    slug: {type:String, unique:true, index:true},
    description:{type:String, unique:false},
    group:{type:String, unique:false},
    image:{type:String, unique:false},
    color:{type:String, unique:false},    
    type:{type:String, unique:false, default:"Category",enum:config.shop.category.types}
});


// API FIXME name_to_slug must be in shared code
function name_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

Categories.methods.slugName=function(){
  return name_to_slug(this.name);
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
	cat.slug=name_to_slug(cat.name);
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


