
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , mongooseAuth = require('mongoose-auth');

 var UserSchema = new Schema({
    id    : Number,
    email : {type : String, index: { unique: true, required : true } },
    first : String,
    last  : String,
    crypted_password :String,
    auth_token : String,
    created:Date,
    
    invoices : [{type: Schema.ObjectId, ref : 'Invoice'}]
});


UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , twitter: {
      everyauth: {
          myHostname: 'http://localhost:3000'
        , consumerKey: config.auth.twit.consumerKey
        , consumerSecret: config.auth.twit.consumerSecret
        , redirectPath: '/'
      }
    }
  , password: {
        loginWith: 'email'
      , extraParams: {
            phone: String
          , name: {
                first: String
              , last: String
            }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'register.jade'
          , loginSuccessRedirect: '/'
          , registerSuccessRedirect: '/'
        }
    }
  , github: {
      everyauth: {
          myHostname: 'http://localhost:3000'
        , appId: config.auth.github.appId
        , appSecret: config.auth.github.appSecret
        , redirectPath: '/'
      }
    }
});
// Adds login: String
  


UserSchema.statics.findByEmail = function(email, success, fail){
	var Users=this.model('Customers');
  Users.findOne({email:email}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

UserSchema.statics.findByToken = function(token, success, fail){
	var Users=this.model('Customers');
  Users.findOne({auth_token:token}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

UserSchema.statics.login = function(email, password, callback){
};

UserSchema.statics.register = function(email, password, confirm, callback){
	var Users=this.model('Customers');
	
	// hash password
	var pwd=require('crypto').createHash('md5').update(password).digest("hex");
	
	// create a new customer
	var user=new Users({
			email:email,
			auth_token:email,
			crypted_password:pwd, 
			created:new Date()
	});
	

	
	//save it
	user.save(function(err){
	});
	callback(user);
};

module.exports = mongoose.model('Customers', UserSchema);



