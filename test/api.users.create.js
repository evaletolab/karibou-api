// Use a different DB for tests
var app = require("../app/index");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users.create", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie;

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Categories.js"],db,function(err){
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

  it('POST /register should return 200 ',function(done){
    var r={
      email:"reg1@test.com",
      firstname:"first",
      lastname:"last",
      password:"12345",
      confirm:"12345"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(200);
        done();        
      });
  });

  it('POST /register duplicate should return 400 ',function(done){
    var r={
      email:"reg1@test.com",
      firstname:"first",
      lastname:"last",
      password:"12345",
      confirm:"12345"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });
  
  it('POST /register confirmation password should return 400 ',function(done){
    var r={
      email:"reg2@test.com",
      firstname:"first",
      lastname:"last",
      password:"12345",
      confirm:"123"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });
  
  it('POST /register without mail should return 400 ',function(done){
    var r={
      firstname:"first",
      lastname:"last",
      password:"12345",
      confirm:"12345"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });

  it('POST /register without data should return 400 ',function(done){
    request(app)
      .post('/register')
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });


  it('POST /login return 200',function(done){  
    request(app)
      .post('/login')
      .send({ email:"reg1@test.com", provider:'local', password:'12345' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.address.should.equal("reg1@test.com");
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

