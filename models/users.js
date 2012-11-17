
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
	, passport = require('passport')
	, bcrypt = require('bcrypt');


 var UserSchema = new Schema({
    id    : Number,
    email : {type : String, index: { unique: true, required : true } },
    first : String,
    last  : String,
    auth_token : String,
    created:Date,
		salt: { type: String, required: true },
		hash: { type: String, required: true },   
    invoices : [{type: Schema.ObjectId, ref : 'Invoice'}]
});


  
UserSchema.virtual('password').get(function () {
  return this._password;
});

UserSchema.virtual('password').set(function (password) {
  this._password = password;
  var salt = this.salt = bcrypt.genSaltSync(10);
  this.hash = bcrypt.hashSync(password, salt);
});

UserSchema.method('verifyPassword', function(password, callback) {
  bcrypt.compare(password, this.hash, callback);
});


UserSchema.static('authenticate', function(email, password, callback) {
  this.findOne({ email: email }, function(err, user) {
      // on error
      if (err) { return callback(err); }
      
      // on user is Null
      if (!user) { return callback(null, false); }
      
      // verify passwd
      user.verifyPassword(password, function(err, passwordCorrect) {
        if (err) { return callback(err); }
        if (!passwordCorrect) { return callback(null, false); }
        return callback(null, user);
      });
    });
});

UserSchema.statics.findByEmail = function(email, success, fail){
	var Users=this.model('Users');
  Users.findOne({email:email}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

UserSchema.statics.findByToken = function(token, success, fail){
	var Users=this.model('Users');
  Users.findOne({auth_token:token}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

UserSchema.statics.login = function(email, password, callback){
  console.log("login",email, password);
};

UserSchema.statics.register = function(email, password, confirm, callback){
	var Users=this.model('Users');
	
	// hash password
	var pwd=require('crypto').createHash('md5').update(password).digest("hex");
	
	// create a new customer
	var user=new Users({
			email:email,
			auth_token:email,
			password:password,
			created:new Date()
	});
	

	
	//save it
	user.save(function(err){
		callback(err, user);
	});
};

module.exports = mongoose.model('Users', UserSchema);



