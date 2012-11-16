
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  
 var CustomerSchema = new Schema({
    id    : Number,
    email : {type : String, index: { unique: true, required : true } },
    first : String,
    last  : String,
    crypted_password :String,
    auth_token : String,
    created:Date,
    invoices : [{type: Schema.ObjectId, ref : 'Invoice'}]
});

CustomerSchema.statics.findByEmail = function(email, success, fail){
  this.model('Customers').findOne({email:email}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

CustomerSchema.statics.findByToken = function(token, success, fail){
  this.model('Customers').findOne({auth_token:token}, function(e, doc){
    if(e){
      fail(e)
    }else{
      success(doc);
    }
  });
}

CustomerSchema.statics.login = function(email, password, callback){
};

CustomerSchema.statics.register = function(email, password, confirm, callback){
	// hash password
	var pwd=require('crypto').createHash('md5').update(password).digest("hex");
	
	// create a new customer
	var user=this.model('Customers')({
			email:email,
			auth_token:email,
			crypted_password:pwd, 
			created:new Date()
	});
	
	//save it
	user.save();
	callback(user);
};

module.exports = mongoose.model('Customers', CustomerSchema);



