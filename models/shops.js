
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
    photo:{
      bg:{ type: String, required: false },
      fg:{ type: String, required: false }
    },
    status:Schema.Types.Mixed,
    owner: {type: Schema.Types.ObjectId, ref : 'Users',required: true},
    created:{type:Date, default: Date.now}
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
	
  if(!shop.owner)shop.owner = user._id;
  //FIXME-- remove:58 : shop.owner = s.owner
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
        callback(("Multiple instance of user for this input: "+user));
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

//
// update shop content
Shops.statics.update=function(id,s,callback){
	var Shops=this.model('Shops');	
	
	//
	// check owner

  return Shops.findOne(id, function (err, shop) {
    //
    // other fields are not managed by update
    shop.description = s.description;
    shop.photo = s.photo;
    if(!shop.owner)shop.owner = s.owner;
    //FIXME-- remove:110 : shop.owner = s.owner
    return shop.save(function (err) {
      return callback(err,shop);
    });
  });
};

Shops.statics.findByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').exec(function(err,user){
  	    if (!user) return callback(err);
  	    callback(err,user.shops);
  	});  	
};

Shops.statics.findAllByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').exec(function(err,user){
  	    if (!user) return callback(err)
  	    callback(err,user.shops);
  	});
  	
};


Shops.statics.findOneShop=function(s,callback){
  	var Shops=this.model('Shops');
    return Shops.findOne(s).populate('owner').exec(function(err,shop){
      callback(err,shop);
    });
};

module.exports =mongoose.model('Shops', Shops);


