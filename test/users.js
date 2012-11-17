// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var customer = mongoose.model('Customers');

// why not using
// https://github.com/1602/jugglingdb



describe("Customers", function(){
  var currentCustomer = null;

  beforeEach(function(done){
    //add some test data    
    customer.register("test@test.com", "password", "password", function(doc){
      currentCustomer = doc;
      done();
    });
  });

  afterEach(function(done){
    customer.remove({}, function(o) {
      done();
    });
  });

  it("registers a new customer", function(done){
    customer.register("test2@test.com", "password", "password", function(doc){
      doc.email.should.equal("test2@test.com");
      doc.crypted_password.should.not.equal("password");
      done();
    }, function(message){
      message.should.equal(null);
      done();
    });
  });

  it("retrieves by email", function(done){
    customer.findByEmail(currentCustomer.email, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("retrieves by token", function(done){
    customer.findByToken(currentCustomer.auth_token, function(doc){
      doc.email.should.equal("test@test.com");
      done();
    });
  });

  it("stats customer", function(done){
  	console.log();
  	done();
  });

/* TODO
  it("authenticates and returns customer with valid login", function(done){
    customer.authenticate(currentCustomer.email, "password", function(customer){
      customer.email.should.equal("test@test.com");
      done();
    }, function(){
      throw("oops");
      done();
    });
  });

  it("authenticates and returns fail with invalid login", function(done){
    customer.authenticate(currentCustomer.email, "liar", function(customer){
      throw("This shouldn't happen");
    }, function(){
      done();
    });
  });
  
*/
});

