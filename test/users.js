// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Users = mongoose.model('Users');

// why not using
// https://github.com/1602/jugglingdb




describe("Users", function(){
  var currentUsers = null;

  beforeEach(function(done){
    //add some test data    
    Users.register("test@test.com", "password", "password", function(err, doc){
      currentUsers = doc;
      done();
    });
  });

  afterEach(function(done){
    Users.remove({}, function(o) {
      done();
    });
  });

  it("registers a new User", function(done){
    Users.register("test2@test.com", "password", "password", function(err, doc){
      doc.email.should.equal("test2@test.com");
      done();
    }, function(message){
      message.should.equal(null);
      done();
    });
  });

  it("retrieves by email", function(done){
    Users.findByEmail(currentUsers.email, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("retrieves by token", function(done){
    Users.findByToken(currentUsers.auth_token, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("stats User", function(done){
  	done();
  });

/* TODO
  it("authenticates and returns User with valid login", function(done){
    Users.authenticate(currentUsers.email, "password", function(User){
      User.email.should.equal("test@test.com");
      done();
    }, function(){
      throw("oops");
      done();
    });
  });

  it("authenticates and returns fail with invalid login", function(done){
    Users.authenticate(currentUser.email, "liar", function(User){
      throw("This shouldn't happen");
    }, function(){
      done();
    });
  });
  
*/
});

