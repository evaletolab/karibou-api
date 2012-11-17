// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var User = mongoose.model('Users');

// why not using
// https://github.com/1602/jugglingdb



describe("Users", function(){
  var currentUser = null;

  beforeEach(function(done){
    //add some test data    
    User.register("test@test.com", "password", "password", function(doc){
      currentUser = doc;
      done();
    });
  });

  afterEach(function(done){
    User.remove({}, function(o) {
      done();
    });
  });

  it("registers a new User", function(done){
    User.register("test2@test.com", "password", "password", function(doc){
      doc.email.should.equal("test2@test.com");
      doc.crypted_password.should.not.equal("password");
      done();
    }, function(message){
      message.should.equal(null);
      done();
    });
  });

  it("retrieves by email", function(done){
    User.findByEmail(currentUser.email, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("retrieves by token", function(done){
    User.findByToken(currentUser.auth_token, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("stats User", function(done){
  	done();
  });

/* TODO
  it("authenticates and returns User with valid login", function(done){
    User.authenticate(currentUser.email, "password", function(User){
      User.email.should.equal("test@test.com");
      done();
    }, function(){
      throw("oops");
      done();
    });
  });

  it("authenticates and returns fail with invalid login", function(done){
    User.authenticate(currentUser.email, "liar", function(User){
      throw("This shouldn't happen");
    }, function(){
      done();
    });
  });
  
*/
});

