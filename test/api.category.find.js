// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.categories", function(){
  var request= require('supertest');
  var _=require('underscore');

  var cookie;
  
  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.js"],db,function(err){
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



    
  it('GET /v1/category?stats=true should return category usedBy ',function(done){
    request(app)
      .get('/v1/category?stats=true')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.forEach(function(c){
          should.exist(c.usedBy)
        })
        done();
      });
  });    
});

