// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Users = mongoose.model('Users');

// why not using
// https://github.com/1602/jugglingdb




describe("Users", function(){
  var profile = null;
  var assert = require("assert");

  beforeEach(function(done){

  	// create a new user
    var user=new Users({
		    provider:"twitter",
		    id:312528659,
		    photo:"https: //si0.twimg.com/profile_images/1385850059/oli-avatar-small_normal.png"
    });

    user.save(function(err){
      profile=user;
      profile.id.should.equal(312528659);
	    done();
    });

  });

  afterEach(function(done){
    Users.remove({}, function(o) {
      done();
    });
  });

  describe("login",function(){
    
    it("validate inexistant Oauth user", function(done){
  		Users.findOrCreate({ id: 1234, provider:profile.provider, photo:profile.photo }, function (err, user) {
  		  user.id.should.equal(1234);
    		return done();
  		});
      
    });

    it("validate existant Oauth user", function(done){
    		Users.findOrCreate({ id: profile.id, provider:profile.provider, photo:profile.photo }, function (err, user) {
  		  user.id.should.equal(profile.id);
    		return done();
  		});
      
    });

    it("validation for wrong provider", function(done){
    		Users.findOrCreate({ id: profile.id, provider:"test", photo:profile.photo }, function (err, user) {
    		err.errors.provider.message.should.equal('Validator "enum" failed for path provider');
    		return done();
  		});      
    });

    it("validation for duplicate id", function(done){
    		Users.findOrCreate({ id: profile.id, provider:"facebook", photo:profile.photo }, function (err, user) {
    		assert(err.code,11000);
    		return done();
  		});
      
    });
    
    
    it.skip("validate provider", function(done){
      
    });
    
    it.skip("validate provider token", function(done){
      
    });

    it.skip("registers a new User", function(done){
  		Users.findOrCreate({ id: profile.id, provider:profile.provider }, function (err, user) {
    		return done(err, user);
  		});
    
      Users.register("test2@test.com", "password", "password", function(err, doc){
        doc.email.should.equal("test2@test.com");
        done();
      }, function(message){
        message.should.equal(null);
        done();
      });
    });

  });
  

  it.skip("retrieves by email", function(done){
    Users.findByEmail(currentUsers.email, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it.skip("retrieves by token (eg. twitter)", function(done){
    Users.findByToken(currentUsers.auth_token, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it.skip("forget password", function(done){
    
  	done();
  });

  it.skip("confirm mail for registration", function(done){
  	done();
  });

  it.skip("authenticates and returns User with valid login", function(done){
    Users.authenticate(currentUsers.email, "password", function(User){
      User.email.should.equal("test@test.com");
      done();
    }, function(){
      throw("oops");
      done();
    });
  });

  it.skip("authenticates and returns fail with invalid login", function(done){
    Users.authenticate(currentUser.email, "liar", function(User){
      throw("This shouldn't happen");
    }, function(){
      done();
    });
  });

  it.skip("registers a new User only via twitter", function(done){
  });

  it.skip("ask to become a seller", function(done){
  });

  it.skip("seller status is accepted", function(done){
  });

  it.skip("seller status is denied", function(done){
  });
  
  describe("Seller", function(){
    it.skip("create shop", function(done){
    });

    it.skip("create a products", function(done){
    });

    it.skip("import images", function(done){
    });

  });
  
  
  
});

