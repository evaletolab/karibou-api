// Use a different DB for tests
var app = require("../app");

var db = require("mongoose");

var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js"]);




describe("Users", function(){

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });  

  after(function(done){
    dbtools.clean(function(){
      done();
    });      
  });

  describe("login",function(){
    
    it("validate inexistant  user", function(done){
  		db.model('Users').findOne({ id: 1234 }, function (err, user) {
  		  should.not.exist(user);
    		return done();
  		});
      
    });

    it("inexistant 'local' user should not automatically created ", function(done){
  		db.model('Users').findOrCreate({ id: 1234, provider:'local' }, function (err, user) {
  		  should.exist(err);
   		  should.not.exist(user);
    		return done();
  		});
      
    });

    it("create user with new email only ", function(done){
      db.model('Users').findOrCreate({ 'email.address':'test@persona.com', provider:'persona' }, function (err, user) {
        should.not.exist(err);
        should.exist(user.id);
        user.email.status.should.equal(true);
        return done();
      });
      
    });

    it("valide Oauth id should create new user ", function(done){
  		db.model('Users').findOrCreate({ id: 1234, provider:'twitter', photo:'olivier.jpg' }, function (err, user) {
  		  should.exist(user);
  		  user.id.should.equal(1234);
    		return done();
  		});
      
    });

    it("find existant Oauth user", function(done){
  		db.model('Users').findOrCreate({ id: data.Users[0].id }, function (err, user) {
  		  user.email.address.should.equal(data.Users[0].email.address);
    		return done();
  		});
      
    });

    it("wrong provider generate an error", function(done){
   		db.model('Users').findOrCreate({ id:12345678, provider:'toto', photo:'olivier.jpg' }, function (err, user) {
        err.errors.provider.path.should.equal('provider');
        err.errors.provider.value.should.equal('toto');
    		return done();
  		});      
    });

    it("duplicate id, one for local and one for facebook, generate an error", function(done){
      db.model('Users').findOrCreate({ id: 1234, provider:"facebook" }, function (err, user) {
    		should.exist(err);
    		err.should.include('utilisé par le provider');
        done()
  		});      
    });
        

    it.skip("validate provider", function(done){
      
    });
    
    it.skip("validate provider token", function(done){
      
    });

    it("registers a new User get duplicate email error", function(done){
      db.model('Users').register("evaleto@gluck.com", "olivier", "evalet", "password", "password", function(err, user){
    		should.exist(err);
    		err.should.include('utilisateur existe');
        done();
      });
    });

    it("duplicate email, one for persona and one for the current registration, generate an error", function(done){
      db.model('Users').register("test@persona.com", "olivier", "evalet", "password", "password", function(err, doc){
        should.exist(err);
        err.should.include('utilisateur existe');
        done();
      });
    });

    it("authenticates and returns User with valid login", function(done){
      db.model('Users').authenticate('evaleto@gluck.com', "password", function(err, user){
        should.not.exist(err)
        user.email.address.should.equal("evaleto@gluck.com");
        done();
      });
    });


  });
  

  
  
  it('should return true if the user has role', function (done) {
      db.model('Users').findOne({id:1279482741765243},function(err,profile){
        console.log(err)
        profile.hasRole('admin').should.be.true;
        profile.hasRole('mod').should.be.true;
        done();
      });
   });
   
   it('should return false if the user does not have role', function (done) {
     db.model('Users').findOne({id:1279482741765243},function(err,profile){
       profile.hasRole('astronaut').should.be.false;
       profile.hasRole('cowboy').should.be.false;
       done();
     });
   });  

  it.skip("retrieves by email", function(done){
    db.model('Users').findByEmail(currentUsers.email, function(doc){
      doc.email.address.should.equal("test@test.com");
      done();
    });
  });

  it.skip("retrieves by token (eg. twitter)", function(done){
    db.model('Users').findByToken(currentUsers.auth_token, function(doc){
      doc.email.address.should.equal("test@test.com");
      done();
    });
  });

  it.skip("forget password", function(done){
    
  	done();
  });


  it.skip("confirm mail for registration", function(done){
    db.model('Users').find({},function(e,u){
  	done();
    });
  	done();
  });

  it.skip("authenticates and returns fail with invalid login", function(done){
    db.model('Users').authenticate(currentUser.email, "liar", function(err, user){
    });
  });

  it.skip("registers a new User only via twitter", function(done){
  });
  
  describe("Customers", function(){
    it.skip("Customers can view their order history and order statuses", function(done){
    });

    it.skip("Customers can maintain their multiple shipping and billing addresses", function(done){
    });

    it.skip("Temporary shopping cart for guests and permanent shopping cart for customers", function(done){
    });

    it.skip("Fast and friendly quick search and advanced search features", function(done){
    });

    it.skip("Product reviews for an interactive shopping experience", function(done){
    });

    it.skip("Secure transactions with SSL", function(done){
    });

    it.skip("Number of products in each category can be shown or hidden", function(done){
    });

    it.skip("Global and per-category bestseller lists", function(done){
    });

    it.skip("Display what other customers have ordered with the current product shown", function(done){
    });

    it.skip("Breadcrumb trail for easy site navigation", function(done){
    });
  });
    
  
});

