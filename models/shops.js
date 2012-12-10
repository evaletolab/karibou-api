
var debug = require('debug')('shops');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  


var Shops = new Schema({
    urlpath:{ type: String, required: false, unique:true },
    name: { type: String, required: true, unique:true },
    description:{ type: String, required: true },
    bgphoto:{ type: String, required: true },
    fgphoto:{ type: String, required: true },
});


//
// API
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

Shops.statics.create = function(shop,user, callback){
  assert(shop);
  assert(user);
  assert(callback);
  
  debug("create product: "+shop);

  
	var Shops=this.model('Shops');	
	var Users=this.model('Users');
  var s =new  Shops(shop);
   
  // if !urlpath => convert name to slug 
  if(!s.urlpath){
    s.urlpath=name_to_slug(s.name);
  }
  
  s.save(function (err) {
    debug("created shop - error: "+err);
    debug("created shop : "+s);

    //
    // bind user with shop
    Users.findOne(user,function(err,user){
      if(!user){
        callback(err);
        return;
      }
      user.shops.push(s);
      user.save(function(err){
        if(err){
          callback(err);
          return;
        }
        callback(err,s);
      });
    });    
  });  

}; 

Shops.statics.findByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').exec(function(err,user){
  	    callback(err,user.shops[0]);
  	});  	
};

Shops.statics.findAllByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').exec(function(err,user){
  	    callback(err,user.shops);
  	});
  	
};


Shops.statics.findOneShop=function(s,callback){
  	var Shops=this.model('Shops');
    return Shops.findOne(s).populate('user').exec(function(err,shop){
      callback(err,shop);
    });
};

module.exports =mongoose.model('Shops', Shops);


