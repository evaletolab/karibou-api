
var debug = require('debug')('shops');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , cache = require("lru-cache")({maxAge:1000 * 60 * 60 * 12,max:50})
  , Promise = mongoose.Promise
  , ObjectId = Schema.ObjectId
  , _ = require('underscore');
  
var EnumPlace=config.shared.marketplace.list;
var EnumRegion=config.shared.region.list;

var Shops = new Schema({
    version:{type:Number, default: 1},
    
    urlpath:{ type: String, required: false, unique:true },
    name: { type: String, required: true, unique:true },
    description:{ type: String, required: false },
    url:{ type: String, required: false },
    photo:{
      owner:{ type: String, required: false },
      bg:{ type: String, required: false },
      fg:{ type: String, required: false },
      source:{ type: String, required: false }
    },
    
    details:{
      bio:{type: Boolean,default:false},
      gluten:{type: Boolean,default:false},
      lactose:{type: Boolean,default:false},
      vegetarian:{type: Boolean,default:false},
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
      fees:{type:Number,select:false, default:config.shared.generalFees},
      tva:{
        number:{type:String,select:false},
        fees:{type:Number,select:false},
      },
      updated:{type:Date, default: Date.now}
    },
    owner: {type: Schema.Types.ObjectId, ref : 'Users',required: true},
    created:{type:Date, default: Date.now}
});


Shops.post('save',function (product) {
  cache.reset();
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
// list changed fields  
Shops.methods.getDiff=function (next) {
  var self=this.toObject(),result={
    available:this.available,
    fees:false
  };

  //
  // check new instance
  if(!next){
    return result;
  }

  //
  // log diff of available
  Object.keys(self.available).forEach(function (attribute) {
    if(self.available[attribute]!==next.available[attribute]){
      result.available[attribute]=next.available[attribute];
    }
  });

  if(self.account&&self.account.fees&&next.account){
    result.fees=(self.account.fees!==next.account.fees)?next.account.fees:false;
  }


  return result;
}

Shops.methods.print=function() {
  var self=this;
  console.log("-- urlpath  , status ", self.urlpath, self.name, self.status);
  console.log("   available ", JSON.stringify(self.available));
  console.log("   account   ", JSON.stringify(self.account));
}

//
// validate shop
//   valid: true, invalid: Date, deleted:false
Shops.methods.updateStatus=function(valid,callback){
  assert(valid!==undefined);  
  var promise = new Promise;
  if(callback){promise.addBack(callback);}

  this.status=true;
  if(valid!==true){
    this.status=Date.now();
  }
  
  this.save(function(err,user) {
    promise.resolve(err,user);
  })
  return promise;
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
    //
    // normalize times
    if(s.available){
      s.available.from&&s.available.from.setHours(0,0,0,0);
      s.available.to&&s.available.to.setHours(0,0,0,0);
    }
    _.extend(shop,s);

 
    return shop.save(callback);
  });
};


//
// Lister les boutiques disponibles dans les dates données
// - tester si la boutique est fermée (aux dates données)
// - tester si la boutique livre aux dates données
// - si il y a plusieurs dates, il suffit qu'une soit ok pour la boutique soit retournée
// or:
//   status === true && (available === true && from < selectedShippingDay)
//   status === true && (available === true && to > selectedShippingDay)
//   status === true && (available.weekdays === selectedShippingDay.getDay() )
Shops.statics.findAvailable=function(rangeDates,callback) {
  var promise = new mongoose.Promise, cacheKey=JSON.stringify(rangeDates);
  if(callback){promise.addBack(callback);}
      

  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }

  var q={
    status:true
  };

  //
  // specify full shipping week 
  var days=[0,1,2,3,4,5,6];
  if(rangeDates.length){
    rangeDates[0].setHours(0,0,0,0);
    days=rangeDates.map(function(r) {
      return r.getDay();
    });

    // if rangesDate == 1
    if(rangeDates.length===1){
      rangeDates.push(new Date(rangeDates[0]))
    }
    rangeDates[rangeDates.length-1].setHours(23,59,0,0);
    
    //
    // filter by date 
    q['$or']=[
      {'available.active':{'$ne':true}},
      {'available.to':{'$lte':rangeDates[rangeDates.length-1]}},
      {'available.from':{'$gt':rangeDates[0]}}
    ];

  }
  
  q['available.weekdays']={'$in':days};

  this.find(q).exec(function(err,shops){
    cache.set(cacheKey,shops);
    promise.resolve(err,shops);    
  });

  return promise;
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

Shops.statics.findByCriteria=function(criteria,callback) {
  var promise = new mongoose.Promise, cacheKey=JSON.stringify(criteria), 
      Shops=this;
  if(callback){promise.addBack(callback);}
      

  var result=cache.get(cacheKey);
  if(result){
    return promise.resolve(null,result);
  }

  //
  // initial find
  function getShops(where){
    var query=Shops.find(where);


    if (criteria.sort){
      console.log("sort shop by creation date: ",criteria.sort);
      query=query.sort(criteria.sort);
    }

    // filter
    if(criteria.status){
      query=query.where("status",true);
    }

    //
    //FILTER only visible shop are available:
    //       if (criteria.user._id == shop.owner || shop.status==true)
    if(!criteria.user||!criteria.user.isAdmin()){
      var filter=[{'status':true}];
      if(criteria.user){
        filter.push({'owner':criteria.user._id});
      }
      query=query.or(filter);
    }

    if(criteria.user&&(criteria.user.isAdmin()||criteria.user.hasRole('logistic'))){
      query=query.populate('owner');      
    }

    query.populate('catalog').exec(function (err,shops){
      if (err){
        return promise.reject(err);
      }

      //
      // as we dont know how to group by with mongo
      if (criteria.group){
        grouped=_.groupBy(shops,function(shop){
          return shop.catalog&&shop.catalog.name;
        });
        
        cache.set(cacheKey,grouped);
        return promise.resolve(null,grouped);
      }

      cache.set(cacheKey,shops);
      return promise.resolve(null,shops);
    });

    return promise;
  }

  if (criteria.category){
    return db.model('Categories').findBySlug(criteria.category,function(e,c){
      if (e){
        return promise.reject(e);
      }
      if (!c){
        return promise.reject("Il n'existe pas de catégorie "+criteria.category);
      }
      return getShops({catalog:c._id});
    });
  }

  return getShops({});
}

Shops.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Shops', Shops);


