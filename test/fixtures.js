
var app = require("../app");
var db      = require("mongoose");
var should  = require("should");


var dbtools = require("./fixtures/dbtools");
var data = dbtools.fixtures(["Users.js","Categories.js"]);
  
describe("mongoose.fixtures", function(){

  before(function(done){
    dbtools.clean(function(err){
      should.not.exist(err)      
      done();
    });
  });

  
  after(function(done){ 
    dbtools.clean(function(err){
      should.not.exist(err)      
      done();
    });
  });
  
  
  it('load json from dbtools.fixtures',function(done){
    should.exist(data.Users)
    should.exist(data.Categories)
    done()
  });
  
  it('load users',function(done){
    dbtools.load(["../fixtures/Users.js"],db, function(err){
      should.not.exist(err)
      db.model('Users').find({},function(e,users){
        users.length.should.equal(4);
        done();
      });
    });
  });

  it('check user password after loading fixture',function(done){
    var u=data.Users[0];
    db.model('Users').authenticate(u.email.address, u.password, function(err,user){
      user.email.address.should.equal(u.email.address);
      done();
    });
  });

  it('load categories',function(done){
    dbtools.load(["../fixtures/Categories.js"],db, function(err){
      should.not.exist(err)
      db.model('Categories').find({},function(e,docs){
        docs.length.should.equal(4);
        done();
      });
    });
  });

  it('load shops',function(done){
    dbtools.load(['../fixtures/Shops.js'],db, function(err,d,c){
      should.not.exist(err)
      db.model('Shops').find({},function(e,docs){
        docs.length.should.equal(4);
        done();
      });
    });
  });

  it('load products',function(done){
    dbtools.load(['../fixtures/Products.js'],db, function(err,d,c){
      should.not.exist(err)
      db.model('Products').find({},function(e,docs){
        docs.length.should.equal(3);
        done();
      });
    });
  });

});




