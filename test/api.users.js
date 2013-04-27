// Use a different DB for tests
var app = require("../app/index");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie;

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
      .send({ email:"evaleto@gluck.com", provider:'local', password:'password' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.address.should.equal("evaleto@gluck.com");
        res.body.hash.should.equal('true');
        res.body.salt.should.equal('true');
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

