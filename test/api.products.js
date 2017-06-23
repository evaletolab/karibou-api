// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
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
        // 2 shops with shop.status=true, 1 shop.status=false
        res.body.length.should.equal(2)
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
    var cookie, delphine, gluck;
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

    it("loggin non admin delphine", function(done){
      request(app)
        .post('/login')
        .send({ email: "delphine@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("delphine@gmail.com");
          delphine = res.headers['set-cookie'];
          should.exist(delphine);
          done();        
      });
    });     

    it("loggin non admin gluck", function(done){
      request(app)
        .post('/login')
        .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gluck.com");
          gluck = res.headers['set-cookie'];
          should.exist(gluck);
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
      p.pricing.tva=0.025;
      delete(p._id);
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          res.text.should.containEql("qui vous appartient")
          res.should.have.status(400);
          done();        
        });
    });    

     
 
    it('POST /v1/shops/un-autre-shop/products  should return 200 ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.categories=data.Categories[1]._id;
      p.title="Test more new product";
      p.details.description="Test more new product";
      p.pricing.price=10.0;
      p.pricing.tva=0.025;
      p.pricing.part="100gr";
      p.photo={url:""}
      request(app)
        .post('/v1/shops/un-autre-shop/products')
        .set('Content-Type','application/json')
        .set('cookie', gluck)
        .send(p)
        .end(function(err,res){
          // console.log(res.text)
          res.should.have.status(200);
          res.body.sku.should.equal(1000000);
          res.body.categories.should.be.an.Object();
          res.body.vendor.should.be.an.instanceOf(Object)
          //res.body.manufacturer.location.should.equal("Genève");
          done();        
        });
    });    

    it('POST /v1/shops/un-autre-shop/products category as object should return 200 ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.categories={_id:data.Categories[1]._id};
      p.title="Test more new product";
      p.details.description="Test more new product";
      p.pricing.price=10.0;
      p.pricing.tva=0.025;
      p.pricing.part="100gr";
      p.photo={url:""}
      request(app)
        .post('/v1/shops/un-autre-shop/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.sku.should.equal(1000001);
          res.body.categories.should.be.an.Object();
          res.body.vendor.should.be.an.instanceOf(Object)
          //res.body.manufacturer.location.should.equal("Genève");
          done();        
        });
    }); 

    it('POST /v1/shops/un-autre-shop/products check sku should return 200 ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.pricing.price=10.0;
      p.pricing.tva=0.025;
      p.pricing.part="100gr";
      p.photo={url:""}
      request(app)
        .post('/v1/shops/un-autre-shop/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.sku.should.equal(1000002);
          res.body.categories.should.be.an.Object();
          res.body.vendor.should.be.an.instanceOf(Object)
          //res.body.categories.length.should.equal(2);
          done();        
        });
    });    


    it('POST update /v1/products/1000002 non owner return 401  ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      delete(p.sku);
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.pricing.price=10.0;
      p.pricing.tva=0.025;
      p.pricing.part="100gr";
      p.photo={url:""}
      request(app)
        .post('/v1/products/1000002')
        .set('Content-Type','application/json')
        .set('cookie', delphine)
        .send(p)
        .end(function(err,res){
          res.should.have.status(401);
          done();        
        });
    });    



    it('POST update /v1/products/1000002 home field should not be modified ',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      delete(p.sku);
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      p.pricing.tva=0.025;
      p.attributes.home=true;
      p.photo={url:""}
      request(app)
        .post('/v1/products/1000002')
        .set('Content-Type','application/json')
        .set('cookie', gluck)
        .send(p)
        .end(function(err,res){
          should.not.exist(res.body.attributes.home);
          done();        
        });
    });    

    it('POST update /v1/products/1000002 change sku field should not be affected',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.sku=123456;
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.attributes.home=false;
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      p.pricing.tva=0.025;
      p.photo={url:""}
      request(app)
        .post('/v1/products/1000002')
        .set('Content-Type','application/json')
        .set('cookie', gluck)
        .send(p)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.sku.should.equal(1000002);
          res.body.categories.should.be.an.String();
          res.body.vendor.should.be.an.instanceOf(Object)
          //res.body.categories.length.should.equal(2);
          done();        
        });
    });    
      

    it('POST update /v1/products/1000002 TVA error',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.sku=123456;
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.attributes.home=false;
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      p.pricing.tva=0.25;
      p.photo={url:""}
      request(app)
        .post('/v1/products/1000002')
        .set('Content-Type','application/json')
        .set('cookie', gluck)
        .send(p)
        .end(function(err,res){
          res.should.have.status(400);
          //res.body.categories.length.should.equal(2);
          done();        
        });
    });      

    it('POST update /v1/products/1000002 TVA error',function(done){
      // shop must be managed
      //p.manufacturer={_id:maker._id};
      var p=_.clone(data.Products[0]);
      delete(p._id);
      p.sku=123456;
      p.categories=data.Categories[2]._id;
      p.title="Test more new product 2";
      p.details.description="Test more new product 2";
      p.attributes.home=false;
      p.pricing.price=10.0;
      p.pricing.part="100gr";
      p.photo={url:""}
      request(app)
        .post('/v1/products/1000002')
        .set('Content-Type','application/json')
        .set('cookie', gluck)
        .send(p)
        .end(function(err,res){
          res.should.have.status(400);
          //res.body.categories.length.should.equal(2);
          done();        
        });
    });      

  });
      
  
    

  
});

