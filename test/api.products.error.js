// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);

describe("api.products.error (with auth)", function(){
  var request= require('supertest');

  var _=require('underscore');
  var cookie;
  

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js"],db,function(err){
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

  it("login", function(done){
    // login
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
      .end(function(err,res){
        res.should.have.status(200);
        //res.headers.location.should.equal('/');
        res.body.email.address.should.equal("evaleto@gluck.com");
        cookie = res.headers['set-cookie'];
        should.exist(cookie);
        done();        
    });
  });	   

  it('GET /v1/products/1000301 should return 400',function(done){
    request(app)
      .get('/v1/products/1000301')
      .expect(400)
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });


  //
  // create a new product without ref to (manufacter, categories)
  //
  it.skip('POST /v1/shops/un-autre-shop/products without manufacturer should return 400 ',function(done){
    // shop must be managed
    var p=_.clone(data.Products[0]);
    delete(p._id);
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send(p)
      .end(function(err,res){
        // shop is not defined
        res.should.have.status(400);
        done();        
      });
  });    

  //
  // create a new product with a manufacter, but without category
  //
  it('POST /v1/shops/un-autre-shop/products  without category should return 400 ',function(done){
    // shop must be managed
    //p.manufacturer={_id:maker._id};
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.title="Test new product";
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send(p)
      .end(function(err,res){
        res.should.have.status(400);
        //res.body.manufacturer.location.should.equal("Genève");
        done();        
      });
  });    

   
  it('POST /v1/shops/un-autre-shop/products without data return 400 ',function(done){
    // shop must be managed
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send({})
      .end(function(err,res){
        res.should.have.status(400);
        done();        
      });
  });    
    

  it('(string0)POST /v1/shops/un-autre-shop/products short strings return 400 ',function(done){
    // shop must be managed
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.title="12";
    p.details.description="123";
    p.categories=[data.Categories[1]._id];
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send(p)
      .end(function(err,res){
        res.should.have.status(400);
        done();        
      });
  });    


  it('(string1)POST /v1/shops/un-autre-shop/products without description return 400 ',function(done){
    // shop must be managed
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.title="123";
    p.details=null;
    p.categories=[data.Categories[1]._id];
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send(p)
      .end(function(err,res){
        res.should.have.status(400);
        done();        
      });
  });    
  
  it('(string2)POST /v1/shops/un-autre-shop/products short strings return 400 ',function(done){
    // shop must be managed
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.title="1234567890123456789012345678901234567890123456789012345678901234567890";
    p.details.description="1234";
    p.categories=[data.Categories[1]._id];
    request(app)
      .post('/v1/shops/un-autre-shop/products')
      .set('cookie', cookie)
      .send(p)
      .end(function(err,res){
        //console.log(res.text)
        res.should.have.status(400);
        done();        
      });
  });    
  
  
    

  
});

