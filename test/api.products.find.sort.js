// Use a different DB for tests
var app = require("../app/index");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.more.js']);

describe("api.products.find", function(){
  var request= require('supertest');

  var _=require('underscore');
  

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.sort.js"],db,function(err){
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

  /** SORTING AND GROUPING */
  it("GET 200,/v1/products?sort=categories.weight", function(done){
    request(app)
      .get("/v1/products?sort=categories.weight")
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        var w=-1;
        res.body.forEach(function(p){
          p.categories[0].weight.should.be.above(w)
          w=p.categories[0].weight;
        });
        done();
      });
  });

  it("GET 200,/v1/products?sort=categories.name", function(done){
    request(app)
      .get("/v1/products?sort=categories.name")
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        n='';
        res.body.forEach(function(p){
          p.categories[0].name.should.be.above(n)
          n=p.categories[0].name;
        });
        done();
      });
  });

  it("GET 200,/v1/products?group=categories.name&sort=categories.name", function(done){
    request(app)
      .get("/v1/products?group=categories.name&sort=categories.name")
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        var n='';
        Object.keys(res.body).forEach(function(k){
          k.should.be.above(n);
          n=k;
        });

        //console.dir(res.body)
        done();
      });
  });
  
});

