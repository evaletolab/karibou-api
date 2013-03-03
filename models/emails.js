
var debug = require('debug')('emails');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  


var Emails = new Schema({
    uid:{ type: String, required: true, unique:true },
    email: { type: String, required: true, unique:true },
    owner: {type: Schema.Types.ObjectId, ref : 'Users',required: true},
    created:{type:Date, default: Date.now}
});


Emails.statics.create = function(user, callback){
  assert(user);
  assert(callback);
  

	var Emails=this.model('Emails');	
   
  //
  // check user for this email
  this.model('Users').findOne({id:user.id},function(err,u){
    if(!u){
      return callback(new Error("Cannot find user: "+user.display()));
    }

    
    //
    // a unique url is created with this user and his email
    var uid=require('crypto').createHash('sha1').update(u.email.address+u.id).digest("hex");
    
    
    var validate =new  Emails({owner:u,uid:uid,email:u.email.address});
    
    validate.save(function (err) {
      return callback(err,validate);
    });  

  });    
   
  

}; 

//
// validate email 
Emails.statics.validate=function(uid,callback){
	var Emails=this.model('Emails');	
	

	//
	// check owner
  return Emails.findOne({uid:uid}).populate('owner').exec(function (err, validate) {
  
    if(err){
      return callback(err);
    }      


    //
    // validate existant email
    if(!validate){
      return callback(new Error("This validation url is no more avaiable (1)"));
    }


    //
    // validate check existant email
    if(validate.email!==validate.owner.email.address){
      return callback(new Error("Cannot find the email ["+validate.email+"] for a validation"));
    }
    
    //
    // validate check timeout
    if (((validate.created-new Date())/1000)>config.validate.email){
      // remove this validation process
      validate.remove();
      return callback(new Error("This validation url is no more avaiable (2)"));
    };
    
    validate.owner.email.status=true;
    
    return validate.owner.save(function (err) {
      //
      // remove this validation process
      if (!err) validate.remove();
      return callback(err);
    });
  });
};


module.exports =mongoose.model('Emails', Emails);


