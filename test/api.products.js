// Use a different DB for tests
var app = require("../app/index");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);

describe("api.products", function(){
  var request= require('supertest');

  var _=require('underscore');
  

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.js"],db,function(err){
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

  it('GET /v1/products should return 200',function(done){
    request(app)
      .get('/v1/products')
      .expect('Content-Type', /json/)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.length.should.equal(3)
        done();
      });
  });

  it('POST /v1/shops/:name/products should return 401 for anonymous',function(done){
    var p=_.clone(data.Products[0]);
    delete(p._id);
    request(app)
      .post('/v1/shops/bicycle-and-rocket/products')
      .set('Content-Type','application/json')
      .send(p)
      .expect(401,done);
  });
  
  describe("with auth", function(){
    var cookie;
    before(function(done){
	    // login
      request(app)
        .post('/login')
        .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gmail.com");
          cookie = res.headers['set-cookie'];
          should.exist(cookie);
          done();        
      });
    });	   

    it("Should be loged-in", function(done){
      request(app)
        .get('/v1/users/me')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .end(function(err,res){
          res.should.have.status(200);
          done();        
      });
    });     
      

    it('POST /v1/shops/bicycle-and-rocket/products should return 400 not shop owner  ',function(done){
      // shop must be managed
      // how to mockup login
      var p=_.clone(data.Products[0]);
      delete(p._id);
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          //console.log(res.text);  
          res.should.have.status(400);
          done();        
        });
    });    

    it('POST /v1/shops should return 200 ',function(done){
    

      var s={
        name: "Bicycle and rocket",
        description:"cool ce shop",
        catalog:data.Categories[0]._id,
        photo:{ 
          bg:"http://image.truc.io/bg-01123.jp",
          fg:"http://image.truc.io/fg-01123.jp"      
        }
      };
      
      //
      // create new shop 'bicycle-and-rocket'
      request(app)
        .post('/v1/shops')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(s)
        .end(function(err,res){
          res.should.have.status(200);
          done();        
        });
    });    
     
 
    it('POST /v1/shops/bicycle-and-rocket/products  should return 200 ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.categories=[data.Categories[1]._id];
      p.title="Test more new product";
      p.details.description="Test more new product";
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.sku.should.equal(100000);
          res.body.categories.should.be.an.array;
          //res.body.manufacturer.location.should.equal("Genève");
          done();        
        });
    });    

    it('POST /v1/shops/bicycle-and-rocket/products check sku should return 200 ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.categories=[data.Categories[2]._id,data.Categories[1]._id];
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.sku.should.equal(100001);
          res.body.categories.should.be.an.array;
          res.body.categories.length.should.equal(2);
          done();        
        });
    });    
      
  });
    
  
    

  
});

