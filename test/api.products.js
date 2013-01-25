// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb




describe("Products API", function(){
  var assert = require("assert");
  var request= require('supertest');
  var async= require('async');

  var db = require('mongoose');
  var _=require('underscore');
  
  var profile;
  var cats; 
  var maker;
  var p={
     title: "Pâtes complètes à l'épeautre ''bio reconversion'' 500g",
     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:false, 
     },  
     
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },

     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     }
  };
  
 
 

  before(function(done){
    async.waterfall([
      function(cb){
        // registered new user with password and provider
        db.model('Users').test(1234,'mypwd', function(err,u){
          profile=u;
	        cb(err);   
        });     
      },
      function(cb){
        // create some categories
        db.model('Categories').create(["Fruits", "Légumes", "Poissons"],function(err,c){
          cats=_.collect(c, function(c){return {_id:c._id}});  
          console.log(c[0].length)
	        cb(err);             
        });
      },
      function(cb){
        // create some manufacturers
        db.model('Manufacturers').create({name:'Olivier', description:'cool'},function(err,m){
          maker=m;  
	        cb(err);   
        });
      }],
      function(err,r){
        assert(!err);
        done();
      });

  });
  
  after(function(done){

    db.model('Manufacturers').remove({},function(){});
    db.model('Categories').remove({},function(){});
    db.model('Shops').remove({},function(){});
    db.model('Products').remove({},function(){});
    db.model('Users').remove({},function(){done();});
    
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
  
  describe("Product API with auth", function(){
    var cookie;
    before(function(done){
	    // login
      request(app)
        .post('/login')
        .send({ id: 1234, password:'mypwd' })
        .end(function(err,res){
          res.should.have.status(302);
          res.headers.location.should.equal('/');
          cookie = res.headers['set-cookie'];
          assert(cookie);
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
    it('POST /v1/shops/bicycle-and-rocket/products should return 200 ',function(done){
      // shop must be managed
      request(app)
        .post('/v1/shops/bicycle-and-rocket/products')
        .set('Content-Type','application/json')
        .set('cookie', cookie)
        .send(p)
        .end(function(err,res){
          // shop is not defined
          res.should.have.status(200);
          res.body.sku.should.be.above(10000);
          res.body.details.isBio.should.equal(false);
          done();        
        });
    });    

    //
    // create a new product with a manufacter
    //
    it('POST /v1/shops/bicycle-and-rocket/products with manufacturer should return 200 ',function(done){
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
          res.should.have.status(200);
          res.body.sku.should.be.above(10001);
          res.body.manufacturer.should.be.a.string;
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
