
var debug   = require('debug')('activities')
  , bus     = require('../app/bus')
  , Q       = require('q')
  , assert  = require("assert")
  , _       =require('underscore')
  , mongoose= require('mongoose')
  , Schema  = mongoose.Schema
  , ObjectId= Schema.Types.ObjectId;
  
var EnumAction="create update delete error".split(' ');


var Activity = new Schema({
  who:{
    id:{ type: Number, required: true },
    name:{ type: String, required: true },
    email:{ type: String, required: true }
  },

  what:{
    type:{ type: String, required: true },
    key:{ type: String, required: true },
    id:{ type: String, required: true },
    action:{ type: String, required: true, enum:EnumAction }
  },

  content:{type:Schema.Types.Mixed, required:true},

  when:{ type: Date, default: Date.now },
   
});



//
// create a new activities 'p' for the shop 's'
Activity.statics.create = function(who,what,content,callback){
  assert(who);
  assert(what);
  assert(content);
  assert(callback);
	var Activities=this, doc={what:what,content:content};

  //
  // set user info
  doc.who={id:who.id,email:who.email.address,name:who.name.familyName};


  //
  // ready to create one product
  var myActivity =new  Activities(doc);
 
  return myActivity.save(callback);  
}; 


Activity.statics.findByCrireria = function(criteria, callback){
  var query={}, from=new Date(),to;


  if(criteria.type){
    query['what.type']=criteria.type;
  }

  if(criteria.month){
    from.setDate(1)
    from.setMonth(parseInt(criteria.month)-1)
    from.setHours(0,0,1,0)
    to=new Date(from);
    to.setDate(from.daysInMonth())
    to.setHours(23,59,59,0)
    query['when']={"$gte": from, "$lte": to};
  }

  if(criteria.when){
    from=new Date(criteria.when);
    from.setHours(0,0,1,0);
    to=new Date(from);
    to.setHours(23,59,59,0)
    query['when']={"$gte": from, "$lte": to};
  }

  //
  // findByUser
  if(criteria.uid){
    query['who.id']=criteria.uid;
  }
  if(criteria.email){
    query['who.email']=new RegExp('^.*'+criteria.email+'.*$', "i");
  }

  //
  // findBy Content
  if(criteria.what){
    query['what.type']=criteria.what;
  }


  if(callback) return this.find(query).exec(callback);
  return this.find(query);
};



Activity.set('autoIndex', config.mongo.ensureIndex);
exports.Activities = mongoose.model('Activities', Activity);


