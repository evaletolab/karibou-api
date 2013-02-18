// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// http://www.scotchmedia.com/tutorials/express/authentication/2/03




describe("Users API", function(){
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
  var shop;
  var cats; 
  var maker;
  var p=_.clone(fx.p1);  
  

  before(function(done){
    async.waterfall([
      function(cb){
        fx.clean(function(err){
          cb(err);
        });
      },
      function(cb){
        // registered new user with password and provider
        db.model('Users').register("evaleto@gluck.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
          profile=user;
	        cb(err);   
        });
      },
      function(cb){
        fx.create_base(profile,function(err, c, s, m){
          shop = s;
          cats = c;
          maker= m;
          cb(err);  
        });


      },
      function(cb){
        //
        // set the manfacturer
        
        var p=_.clone(fx.p1);
        p.manufacturer=maker;
        p.categories=[cats[0]];
        db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
          assert(shops);
          db.model('Products').create(p,shops[0],function(err,product){
            cb(err)  
          });
        });
      },
      function(cb){

        var p=_.clone(fx.p2);
        p.manufacturer=maker;
        p.categories=[cats[1]];
        db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
          assert(shops);
          db.model('Products').create(p,shops[0],function(err,product){
            cb(err)  
          });
        });

      }],
      function(err,r){
        err && console.log("ERROR -------------",err)
        assert(!err);
        done();
      });

  });
  

  after(function(done){
    fx.clean(function(){    
      db.model('Users').remove({},function(){done();});
    });
  });
  



  it('GET /v1/users/me should return 401',function(done){
    request(app)
      .get('/v1/users/me')
      .expect(401,done);
  });

  it('POST /login should return 401 ',function(done){
    request(app)
      .post('/login')
      .send({ id: "evaleto@gluck.com", password:'12', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(401);
        res.body.error.should.be.a.string;        
        done();        
      });
  });

  it('POST /login with ID should return 302 on /',function(done){
  
    request(app)
      .post('/login')
      .send({ id:"evaleto@gluck.com", provider:'local', password:'mypwd' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.address.should.equal("evaleto@gluck.com");
        cookie = res.headers['set-cookie'];
        //res.headers.location.should.equal('/');
        done();        
      });
  });

   
  it('GET /v1/users/me should return 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .expect(200,done);

  });
      
});

