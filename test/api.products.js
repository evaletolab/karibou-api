// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// HTTP Error list
// http://en.wikipedia.org/wiki/List_of_HTTP_status_codes



describe("api.products", function(){
  var assert = require("assert");
  var request= require('supertest');
  var async= require('async');

  var db = require('mongoose');
  var _=require('underscore');
  var fx = require('./fixtures/products');
  
  var profile;
  var shop;
  var cats; 
  var maker;
  var p=_.clone(fx.p1);  
 
 

  var products, shop, cats, maker;


  // common befor/after
  before(function(done){
    fx.create_all(function(err,s,c,m,p){
      assert(!err);
      shop=s;cats=c;maker=m;products=p;
      done()
    })
  
  });

  
  after(function(done){

    fx.clean(function(){    
      db.model('Users').remove({},function(){done();});
    });
    
  });

  it('GET /v1/products/100001 should return 401',function(done){
    request(app)
      .get('/v1/products/100001')
      .expect('Content-Type', /json/)
      .expect(401)
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });

  it('POST /v1/shops/:name/products should return 302 for anonymous',function(done){
    request(app)
      .post('/v1/shops/bicycle-and-rocket/products')
      .set('Content-Type','application/json')
      .send(p)
      .expect(302,done);
  });
  
  describe("with auth", function(){
    var cookie;
    before(function(done){
	    // login
      request(app)
        .post('/login')
        .send({ email: "evaleto@gluck.com", password:'mypwd',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gluck.com");
          cookie = res.headers['set-cookie'];
          assert(cookie);
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
      

    it('POST /v1/shops/bicycle-and-rocket/products should return 401 shop not found ',function(done){
      // shop must be managed
      // how to mockup login
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          // shop is not defined
          //console.log(res.text);  
          
          res.should.have.status(401);
          done();        
        });
    });    

    it('POST /v1/shops should return 200 ',function(done){
    

      var s={
        name: "Bicycle and rocket",
        description:"cool ce shop",
        bgphoto:"http://image.truc.io/bg-01123.jp",
        fgphoto:"http://image.truc.io/fg-01123.jp"      
      };
      
      //
      // create new shop 'bicycle-and-rocket'
      request(app)
        .post('/v1/shops')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(s)
        .end(function(err,res){
          //console.log(res.text)
          res.should.have.status(200);
          done();        
        });
    });    
     
    //
    // create a new product without ref to (manufacter, categories)
    //
    it('POST /v1/shops/bicycle-and-rocket/products without manufacturer should return 400 ',function(done){
      // shop must be managed
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
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
    it('POST /v1/shops/bicycle-and-rocket/products with manufacturer without category should return 400 ',function(done){
      // shop must be managed
      p.manufacturer={_id:maker._id};
      p.title="Test new product";
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          // shop is not defined 
          res.should.have.status(400);
          //res.body.manufacturer.location.should.equal("Genève");
          done();        
        });
    });    

    //
    // create a new product with a manufacter and some categories
    //
    it('POST /v1/shops/bicycle-and-rocket/products with manufacturer should return 200 ',function(done){
      // shop must be managed
      p.manufacturer={_id:maker._id};
      p.categories=cats;
      p.title="Test more new product";
      //console.log(p);
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          // shop is not defined
          //console.log(res.body)
          res.should.have.status(200);
          res.body.sku.should.be.above(10001);
          res.body.manufacturer.should.be.a.string;
          res.body.categories.should.be.an.array;
          //res.body.manufacturer.location.should.equal("Genève");
          done();        
        });
    });    
      
  });
    
  
    

  
});

