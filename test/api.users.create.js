// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var _= require('underscore');
var should = require("should");require("should-http");
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

  it.skip('POST /register should return 200 ',function(done){
    var r={
      email:"Reg1@test.com",
      firstname:"first",
      lastname:"last",
      password:"123456",
      confirm:"123456"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){   
        res.should.have.status(200);
        var payment=_.find(res.body.payments,function (p) {
            return p.issuer==='wallet';
        })
        should.exist(payment);
        done();        
      });
  });

  it('POST /register duplicate should return 400 ',function(done){
    var r={
      email:"reg1@test.com",
      firstname:"first",
      lastname:"last",
      password:"123456",
      confirm:"123456"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });
  
  it('POST /register with wrong confirmation password should return 400 ',function(done){
    var r={
      email:"reg2@test.com",
      firstname:"first",
      lastname:"last",
      password:"123456",
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
  
  it('POST /register short password should return 400 ',function(done){
    var r={
      email:"reg2@test.com",
      firstname:"first",
      lastname:"last",
      password:"1234",
      confirm:"1234"
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
      password:"123456",
      confirm:"123456"
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });

  it('POST /register with incomplet phone should return 400 ',function(done){
    var r={
      email:"reg3@test.com",
      firstname:"first",
      lastname:"last",
      password:"123456",
      confirm:"123456",
      phoneNumbers:[{what:'phone'}],
      addresses:[]
    };
  
    request(app)
      .post('/register')
      .send(r)
      .end(function(err,res){      
        res.should.have.status(400);
        done();        
      });
  });

  it('POST /register with incomplet address should return 400 ',function(done){
    var r={
      email:"reg3@test.com",
      firstname:"first",
      lastname:"last",
      password:"123456",
      confirm:"123456",
      phoneNumbers:[],
      addresses:[{what:'phone'}]
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
      .send({ email:"reg1@test.com", provider:'local', password:'123456' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.address.should.equal("reg1@test.com");
        should.not.exist(res.body.hash)
        should.not.exist(res.body.salt)
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

