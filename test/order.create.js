// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.more.js","Shops.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("orders.create", function(){
  var _ = require("underscore");

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
    });    
  });

  

  it("Error on creation of a empty order", function(done){
    var items=[], customer={}, shipping={};
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    Orders.create(items, customer, shipping,function(err,order){
      console.log(err)
      should.exist(err)
      done();          
    });
  });


  it("Error on creation of a new order without items", function(done){
    done();
  });
});

