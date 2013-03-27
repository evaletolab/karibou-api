// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// http://www.scotchmedia.com/tutorials/express/authentication/2/03




describe("api.shops", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');
  var Users = require('mongoose').model('Users');
  var async= require('async');

  var db = require('mongoose');
  var _=require('underscore');
  var fx = require('./fixtures/products');

  var cookie;

  var profile;
  var p=_.clone(fx.p1);  
  
  var products, shop, cats, maker;

  var s={
      name: "Un autre shop",
      description:"cool ce shop",
      photo:{ 
        bg:"http://image.truc.io/bg-01123.jp",
        fg:"http://image.truc.io/fg-01123.jp"      
      }
    };

  // common befor/after
  before(function(done){
      // create 3 user and one shop
      db.model('Users').register("evaleto@gluck.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
        profile=user;
        
        db.model('Users').register("evaleto@pouet.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
          db.model('Shops').create(s,user, function(err,shop){
            db.model('Users').register("evaleto@gmail.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
              done();
            });

          });        

        });
      });
  
  });
  

  after(function(done){
    fx.clean(function(){    
      db.model('Users').remove({},function(){done();});
    });
  });
  



  it('GET /v1/shops/this-shop-doesnt-exist should return 400',function(done){
    request(app)
      .get('/v1/shops/this-shop-doesnt-exist')
      .expect(400,done);
  });

  it('POST /v1/shops/un-autre-shop should return 401 (you are anonymous)',function(done){
    request(app)
      .post('/v1/shops/un-autre-shop')
      .expect(401,done);
  });  
  

  it('POST /login should return 200 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'mypwd', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(200);
        res.body.roles.should.include('admin');
        cookie = res.headers['set-cookie'];
        done();        
      });
  });

   
  it('POST /v1/shops/un-autre-shop should return 200 (you are admin)',function(done){
    request(app)
      .post('/v1/shops/un-autre-shop')
      .set('cookie', cookie)
      .expect(200,done);
  });     

  it('GET /v1/users/me should return 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .expect(200,done);

  });
      
});

