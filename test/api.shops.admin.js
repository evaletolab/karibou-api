// Use a different DB for tests
var app = require("../app/index");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js"]);



describe("api.shops", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie;


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Shops.js"],db,function(err){
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
      .send({ email: "evaleto@gmail.com", password:'password', provider:'local' })
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
      .end(function(err,res){      
        res.should.have.status(200);
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

