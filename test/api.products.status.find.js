// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.more.js']);

describe("api.products.find", function(){
  var request= require('supertest');
  var _=require('underscore');
  
  var admin;
  

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

  // user (_id:12345, email:gluck)
  // 2products ->shop[0](un-autre-shop, id:0004, status:true,  owner:gluck)
  // 1product  ->shop[1](mon-shop,      id:0005, status:false, owner:gmail)
  // 0product  ->shop[2](invalid-shop,  id:0006, status:Date , owner:gluck)
  it('user.admin /login return 200',function(done){  
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'password', provider:'local' })
      .end(function(err,res){        
        res.should.have.status(200);
        admin = res.headers['set-cookie'];
        done();        
      });
  });

  it('Change user status to FALSE /v1/users/:id/status should return 200 for admin only',function(done){
    request(app)
      .post('/v1/users/12345/status')
      .set('cookie', admin)
      .send({status:false})
      .end(function(err,res){  
        res.should.have.status(200);
        res.body.status.should.equal(false)
        done();        
      });
  });

  it("GET 200,/v1/shops/un-autre-shop/products/what-ever-filters should return 0 product", function(done){
    request(app)
      .get("/v1/shops/un-autre-shop/products/category/"+data.Categories[3].slug+"/details/bio+ogm+gluten")
      .end(function(err, res){
        res.should.have.status(200);
        // user gluck status=false => shop.status=false => products(gluck).size=0
        res.body.length.should.equal(0)
        done();
      });
  });  

  it("GET 200,/v1/shops/un-autre-shop/products should return 0 product", function(done){
    request(app)
      .get("/v1/shops/un-autre-shop/products")
      .end(function(err, res){
        //console.log(res.body)
        res.should.have.status(200);
        // user gluck status=false => shop.status=false => products(gluck).size=0
        res.body.length.should.equal(0)
        done();
      });
  });  

  
  it('users.post status FALSE /v1/users/:id/status should return 200 ',function(done){
    request(app)
      .post('/v1/users/12345/status')
      .set('cookie', admin)
      .send({status:true})
      .end(function(err,res){  
        res.should.have.status(200);
        res.body.status.should.equal(true)
        done();        
      });
  });

  
});

