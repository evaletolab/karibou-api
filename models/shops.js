
var debug = require('debug')('shops');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId
  , _ = require('underscore');
  

var EnumPlace=config.shop.marketplace.list;
var EnumLocation=config.shop.location.list;

var Shops = new Schema({
    version:{type:Number, default: 1},
    
    urlpath:{ type: String, required: false, unique:true },
    name: { type: String, required: true, unique:true },
    description:{ type: String, required: false },
    url:{ type: String, required: false },
    photo:{
      owner:{ type: String, required: false },
      bg:{ type: String, required: false },
      fg:{ type: String, required: false }
    },
    
    details:{
      bio:{type: Boolean,default:false},
      gluten:{type: Boolean,default:false},
      lactose:{type: Boolean,default:false},
      local:{type: Boolean,default:false}      
    },

    //
    // define where this shop is available (geneva/lausanne/...)
    marketplace: [{type: String, required: false, enum: EnumPlace, default:config.shop.marketplace.default}],
    
    //
    // where to pickup items
    address:{
          name: { type: String, trim: true },
          floor: { type: String, trim: true },
          streetAdress: { type: String, lowercase: true, trim: true },
          location: { type: String, trim: true, enum: EnumLocation},
          region: { type: String, trim: true, default:"GE" },
          postalCode: { type: String },
          geo:{
            lat:{type:Number},
            lng:{type:Number}
          }
    },    

    //
    // this shop belongsTo a category
    catalog:{type: Schema.Types.ObjectId, ref : 'Categories' , requiered:true},
    
    faq:[{
      q:{type: String, required: true},
      a:{type: String, required: true},
      updated:{type:Date, default: Date.now}
    }],
    
    available:{
      active:{type: Boolean,default:false},
      comment:{type: String}
    },

    info:{
      active:{type: Boolean,default:false},
      comment:{type: String}
    },
    
    //
    // type Date on pending, set true on active, false on deleted
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

  shop.owner = user._id;
  //FIXME check if category.type=='Catalog'
  if (!shop.catalog){
    return callback("Votre boutique doit figurer dans le catalogue");
  }
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
    Users.find({_id:user._id},function(err,u){
      if(!u.length>1){
        callback(("Multiple instance of user for this input: "+user));
        return;
      }

      if(!u[0]){
        callback(("Cannot find user: "+user));
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
// validate shop
//   valid: true, invalid: Date, deleted:false
Shops.methods.updateStatus=function(valid,callback){
  // special case
  if (valid===undefined && callback===undefined){
  }
  
  //
  // 
  if(valid!==true){
    this.status=Date.now();
    return this.save(callback)
  }
  
  //
  // 
  this.status=true;
  return this.save(callback)
}

//
// update shop content
Shops.statics.update=function(id,s,callback){
	var Shops=this.model('Shops');	
	
	if (!Object.keys(id).length) return callback("You have to define one shop for update");

  //findOneAndUpdate(conditions, update) 
  return Shops.findOne(id).populate('owner').exec(function (err, shop) {
    //
    // other fields are not managed by update
    //console.log(shop)
    if (!shop){
      return callback("Could not find shop for update "+JSON.stringify(id))
    }
    
    s.catalog=(s.catalog&&s.catalog._id)?s.catalog._id:s.catalog;
    s.owner&&delete(s.owner);
    _.extend(shop,s);

 
    return shop.save(function (err) {    
      return callback(err,shop);
    });
  });
};

Shops.statics.findByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').populate('catalog').exec(function(err,user){
  	    if (!user) return callback(err);
  	    callback(err,user.shops);
  	});  	
};

Shops.statics.findAllByUser=function(u,callback){
  	return this.model('Users').findOne(u).populate('shops').populate('catalog').exec(function(err,user){
  	    if (!user) return callback(err)
  	    callback(err,user.shops);
  	});
  	
};


Shops.statics.findOneShop=function(s,callback){
  	var Shops=this.model('Shops');
    return Shops.findOne(s).populate('owner').populate('catalog').exec(function(err,shop){
      callback(err,shop);
    });
};


Shops.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Shops', Shops);


