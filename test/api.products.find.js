// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.more.js']);

describe("api.products.find", function(){
  var request= require('supertest');

  var _=require('underscore');
  

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

  it('GET 200,/v1/products/1000003 should return 200',function(done){
    request(app)
      .get('/v1/products/1000003')
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
  
  it("GET 200,/v1/shops/un-autre-shop/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten", function(done){
    request(app)
      .get("/v1/shops/un-autre-shop/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten")
      .end(function(err, res){
        //console.log(res.text)
        res.should.have.status(200);
        res.body.length.should.equal(1)
        res.body[0].sku.should.equal(1000002);
        done();
      });
  });  

  it("GET 400,/v1/shops/un-autre-shop2/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten", function(done){
    request(app)
      .get("/v1/shops/un-autre-shop2/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten")
      .end(function(err, res){
        res.should.have.status(400);
        done();
      });
  });  



  it("GET 200,/v1/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten", function(done){
    request(app)
      .get("/v1/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten")
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.length.should.equal(1)
        res.body[0].sku.should.equal(1000002);
        done();
      });

  });
  
  
});

