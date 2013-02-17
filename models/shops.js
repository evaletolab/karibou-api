
var debug = require('debug')('shops');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  


var Shops = new Schema({
    urlpath:{ type: String, required: false, unique:true },
    name: { type: String, required: true, unique:true },
    description:{ type: String, required: false },
    bgphoto:{ type: String, required: false },
    fgphoto:{ type: String, required: false },
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
Shops.statics.slug = name_to_slug;
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

    if (err){
      return callback(err);
    }
    //
    // bind user with shop
    Users.find(user,function(err,u){
      if(!u.length>1){
        callback(new Error("Multiple instance of user for this input: "+user));
        return;
      }

      if(!u[0]){
        callback(new Error("Cannot find user: "+user));
        return;
      }
      u[0].shops.push(s);
      u[0].save(function(err){
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
  	    callback(err,user.shops);
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


