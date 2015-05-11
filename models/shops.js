
var debug = require('debug')('shops');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId
  , _ = require('underscore');
  
var EnumPlace=config.shop.marketplace.list;
var EnumRegion=config.shop.region.list;

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
    // define where this shop is available
    marketplace: [{type: String, required: false}],
    
    //
    // where to pickup items
    address:{
          // an other place where things are stored
          depository:{ type: String, trim: true },
          name: { type: String, trim: true },
          floor: { type: String, trim: true },
          phone: { type: String, trim: true },
          streetAdress: { type: String, lowercase: true, trim: true },
          region: { type: String, trim: true, default:"Genève", enum: EnumRegion },
          postalCode: { type: String, trim: true  },
          geo:{
            lat:{type:Number},
            lng:{type:Number}
          }
    },    

    //
    // this shop belongsTo a category
    catalog:{type: Schema.Types.ObjectId, ref : 'Categories' , requiered:true},
    
    //
    // answer question about your shop
    faq:[{
      q:{type: String, required: true},
      a:{type: String, required: true},
      updated:{type:Date, default: Date.now}
    }],
    
    available:{
      active:{type: Boolean,default:false},
      from:Date,
      to:Date,
      weekdays:[Number],
      comment:{type: String}
    },

    info:{
      active:{type: Boolean,default:false},
      comment:{type: String}
    },
    
    //
    // type Date on pending, set true on active, false on deleted
    status:Schema.Types.Mixed,
    // secret value for the business model
    // - > is available/displayed for shop owner and admin ONLY
    // - > is saved on each order to compute bill 
    account:{
      fees:{type:Number,select:false, default:config.shop.generalFees},
      updated:{type:Date, default: Date.now}
    },
    owner: {type: Schema.Types.ObjectId, ref : 'Users',required: true},
    created:{type:Date, default: Date.now}
});



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
    s.urlpath=s.name.slug();
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
    
    //
    // if shop is not available, set the date correctly  

    //
    // get catalog from object._id or _id
    s.owner&&delete(s.owner);
    _.extend(shop,s);

 
    return shop.save(callback);
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
	var Shops=this.model('Shops'), query;
  query=Shops.findOne(s).populate('owner').populate('catalog');
  if(callback)return query.exec(callback)
  return query;
};


Shops.statics.findAllBySlug=function (slugs,callback) {
  var Shops=this.model('Shops'), q=(Array.isArray(slugs))?slugs:[slugs];

  var query=Shops.find({urlpath:{"$in":q}}).populate('owner').populate('catalog')
  if(callback)return query.exec(callback)
  return query;
}

Shops.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Shops', Shops);


