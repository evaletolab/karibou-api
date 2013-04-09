// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// http://www.scotchmedia.com/tutorials/express/authentication/2/03




describe("api.users", function(){
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
  



  it('GET /v1/users/me should return 401',function(done){
    request(app)
      .get('/v1/users/me')
      .expect(401,done);
  });

  it('POST /login should return 401 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'12', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(401);
        res.body.should.be.a.string;        
        done();        
      });
  });

  it('POST /login with ID should return 302 on /',function(done){
  
    request(app)
      .post('/login')
      .send({ email:"evaleto@gluck.com", provider:'local', password:'mypwd' })
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

