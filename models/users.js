
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , validate = require('./validate')
	, passport = require('passport');
	
//var	bcrypt = require('bcrypt');
var extend      = require( 'node.extend' );

 /* Enumerations for field validation */
 var EnumGender="homme femme".split(' ');
 var EnumProvider="twitter facebook goolge local".split(' ');


 

 // Normalized profile information conforms to the contact schema established by Portable Contacts.
 // http://portablecontacts.net/draft-spec.html#schema
 // MongoError: E11000 duplicate key error index: karibou-devel.users.$email.address_1  dup key: { : null }
 var UserSchema = new Schema({
    /* A unique identifier for the user, as generated by the service provider.  */
    id    : {type:Number, required: true, unique: true},   

    /* The provider which with the user authenticated (facebook, twitter, etc.) */
    provider: {type:String, required: true, unique: false, enum: EnumProvider}, 
    
    email:{
      address:{type : String, index:true, unique: true, required : false, 
        validate:[validate.email, 'invalid email address']
      },
      status:Schema.Types.Mixed,
    },
    
    /* The name of this user, suitable for display.*/
    displayName:String, 
    name: {
        familyName: String,
        givenName: String
    },
    
    birthday: Date,
    gender: {type:String, enum:EnumGender},
    tags: [String],
    url:{type:String, validate:[validate.url,'Invalide URL format or lenght']},
    
    phoneNumbers: [{
          value: String,
          type: String
    }],
    
    photo: String,
    
    addresses: [{
          type: { type: String, required : true, lowercase: true, trim: true },
          streetAdress: { type: String, required : true, lowercase: true, trim: true },
          locality: { type: String, required : true, trim: true /**,
            validate:[validate.alpha, 'Invalide locality'] **/
          },
          region: { type: String, required : true, trim: true, default:"GE" },
          postalCode: { type: String, required : false /**,
            validate:[validate.postal,'Invalide postal code'] **/
          },
          primary:{ type: Boolean, required : true, default:false},
          location:{
            lat:{type:Number, required: true},
            lng:{type:Number, required: true}
          }
    }],
    
    /* preferred products*/
    likes: [{type: Schema.Types.ObjectId, ref : 'Products'}],
    
    /* The available Shop for this user */
    shops: [{type: Schema.Types.ObjectId, ref : 'Shops'}],
    
    
    /* */    
    invoices : [{type: Schema.Types.ObjectId, ref : 'Invoice'}],
    
    /* password and creation date (for local session only)*/    
    created:{type:Date, default: Date.now},
		salt: { type: String, required: false },
		hash: { type: String, required: false },   
		roles: Array
});

/**
UserSchema.pre("save",function(next, done) {
    var self = this;
    if (!self.email || true) {
      done();
      return next();
    }
    this.model("Users").findOne({'email.address' : self.email.address},function(err, user) {
        if(err) {
            done(err);
        } else if(user) {
            self.invalidate("email.address","L'address email doit être unique");
            done(new Error("L'address email doit être unique"));
        } else {
            done();
        }
    });
    next();
});

  **/
/**
 * validation functions
 */
//UserSchema.path('XYZ').validate(function (value) {
//  return /male|female|homme|femme/i.test(value);
//}, 'Invalid gender');

UserSchema.statics.findOrCreate=function(u,callback){
	var Users=this.model('Users');
  Users.findOne(u, function(err, user){
    if(!user){
      if (u.provider==='local'){
        return callback("The system can not automaticaly create user for local provider");
      }
      
//      Users.findOne({'email.address' : u.email.address},function(err, user) {
//        if(user){
//          callback("L'address");
//        }
//      });
      
      var newuser=new Users(u);
      newuser.save(function(err){
        //if ( err && err.code === 11000 )
        callback(err,newuser);
      });
    }else{
      callback(err, user);
    }
  });

};


UserSchema.statics.findByEmail = function(email, success, fail){
  return this.model('Users').findOne({'email.address':email}).populate('shops').exec(function(err,user){
    if(err){
      fail(err)
    }else{
      success(user);
    }
  });
};

UserSchema.statics.findByToken = function(token, success, fail){
  return this.model('Users').findOne({provider:token}).populate('shops').exec(function(err,user){
    if(err){
      fail(err)
    }else{
      success(user);
    }
  });
};

UserSchema.methods.isAdmin = function () {
  return this.hasRole('admin');
};

UserSchema.methods.hasRole = function (role) {
 for (var i = 0; i < this.roles.length; i++) {
   if (this.roles[i] === role) {
     // if the role that we are chekign matches the 'role' we are
     // looking for return true
     return true;
   }

 };
 // if the role does not match return false
 return false;
};

UserSchema.methods.addLikes = function(product, callback){
  this.likes.push(product._id);
  this.save(function(err){
    callback(err);
  });
};

UserSchema.methods.removeLikes = function(product, callback){
  this.likes.pop(product._id);
  this.save(function(err){
    callback(err);
  });
};

UserSchema.methods.display = function(){
  if (this.displayName)return this.displayName;
  if (this.name && (this.name.givenName || this.name.familyName)) {
    return this.name.givenName+' '+this.name.familyName
  }
  if (this.id){
    return this.id+'@'+this.provider;
  }
    
  return 'Anonymous';
};

UserSchema.statics.login = function(email, password, callback){
  console.log("login",email, password);
};


/**
 * local registration
 * - virtual field for password (mapped to salt && hash)
 * - verify password 
 * - authenticate
 * - register
 */  
UserSchema.virtual('password').get(function () {
  return this._password;
});

UserSchema.virtual('password').set(function (password) {
  this._password = password;
// more safe
//  var salt = this.salt = bcrypt.genSaltSync(10);
//  this.hash = bcrypt.hashSync(password, salt);
  var crypto= require('crypto');
  var salt  = this.salt = crypto.randomBytes(32).toString('base64'); 
  // FIXME hash method are not safe, use bcrypt 
  this.hash = crypto.createHash('sha1').update(password).digest("hex")
});

UserSchema.method('verifyPassword', function(password, callback) {
  var hash=require('crypto').createHash('sha1').update(password).digest("hex");

  callback(null,hash===this.hash);  
//  bcrypt.compare(password, this.hash, callback);
});


UserSchema.statics.authenticate=function(email, password, callback) {

  return this.model('Users').findOne({ 'email.address': email }).populate('shops').exec(function(err,user){
      if (err) { return callback(err); }

      // on user is Null
      if (!user) { return callback("L'utilisateur ou le mot de passe est incorrect", false); }
      // verify passwd
      user.verifyPassword(password, function(err, passwordCorrect) {
        if (err) { return callback(err); }
        if (!passwordCorrect) { return callback(null, false); }
        return callback(null, user);
      });
    });
};



UserSchema.statics.register = function(email, first, last, password, confirm, callback){
	var Users=this.model('Users');
	//error("TODO, we cannot register a user without matching a common provider (twitter, google, fb, flickr)");
	
	if (password !==confirm){
	  callback(("password confirmation is not identical"));
	  return;
	}
	
	//hash password (see virtual methods )
	//var pwd=require('crypto').createHash('sha1').update(password).digest("hex");
	
    
  /* The name of this user, suitable for display.*/
  //FIXME email.hash() should be replaced by (id++)+10000000
	// create a new customer
	var user=new Users({
	    id:email.hash(),
      displayName:first+" "+last, 
      name: {
          familyName: last,
          givenName: first
      },
      email:{address:email,status:new Date()},
			provider:"local",
			password:password,
			created:new Date()
	});

	//save it
	user.save(function(err){	  
	  //FIXME manage the duplicate address ( err && err.code === 11000 )
		callback(err, user);
	});
};


//
// update shop content
UserSchema.statics.update=function(id, u,callback){
	var Users=this.model('Users');	
	
	//
	// check owner

  return Users.findOne(id).populate('shops').exec(function (err, user) {
    if (u.name&&u.name.familyName) user.name.familyName=u.name.familyName;
    if (u.name&&u.name.givenName) user.name.givenName=u.name.givenName;
    
    if (u.email&&u.email.address) {
      if (user.email.address!==u.email.address)
        user.email.status=new Date();
      user.email.address=u.email.address;
    }
    if (u.addresses) user.addresses=u.addresses;
    
    user.save(function (err) {
      //if ( err && err.code === 11000 )
      callback(err,user);
    });
  });
};


module.exports = mongoose.model('Users', UserSchema);



