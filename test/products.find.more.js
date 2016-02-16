var app = require("../app");

var db = require("mongoose");


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.more.js","Shops.js"]);
var Users=db.model('Users');


describe("products.find.more", function(){
  var _ = require("underscore");
  var Products=db.model('Products');


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.more.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });


  after(function(done){
    dbtools.clean(function(){
      done();
    })
  });

  it("Find popular products ", function(done){
    var criteria={ popular: true };
    Products.findByCriteria(criteria,function(err,products){
      should.not.exist(err);
      should.exist(products);
      products.length.should.equal(3)
      done();
    });  
  });



  it("Find home products ", function(done){
    var criteria={ home:true };
    Products.findByCriteria(criteria,function(err,products){
      should.not.exist(err);
      should.exist(products);
      products.length.should.equal(1)
      done();
    });  

  });
  
  it("Find discount products ", function(done){
    var criteria={ discount:true };
    Products.findByCriteria(criteria,function(err,products){
      should.not.exist(err);
      should.exist(products);
      products.length.should.equal(1)
      done();
    });  

  });

  


});

