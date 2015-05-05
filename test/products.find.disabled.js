var app = require("../app");

var db = require("mongoose");


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.disabled.js"]);
var Users=db.model('Users');


describe("products.find.disabled:", function(){
  var async= require("async");
  var _ = require("underscore");
  var Products=db.model('Products');


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.disabled.js"],db,function(err){
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

  //product 1 not available , but shop is available
  //product 2 available , shop not available
  //product 3 available , shop closed
  //product 4 available , shop will be closed in futur
  //product 5 available , shop was closed in past
  it("only product 4, 5 should be available", function(done){
    Products.findByCriteria({status:true,available:true},function(err,products){
      should.not.exist(err);
      should.exist(products);
      console.log('find',products.map(function (p) {return p.sku;}));
      products.length.should.equal(2)
      products[0].sku.should.equal(1000004);
      products[1].sku.should.equal(1000005);
      done();
    });  
  });


  it.skip("Product could have a related products", function(done){
  });

  it.skip("Product could have variations", function(done){
  });

  it.skip("Control if out of stock products can still be shown and are available for purchase", function(done){
  });


});

