// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users.phones", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie, user;

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
  



  it('POST /register should return 200 ',function(done){
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
        res.should.have.status(200);
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
        user=res.body;
        //res.headers.location.should.equal('/');
        done();        
      });
  });

   

  it('POST without phone /v1/users/<uid> should return 400',function(done){
    var u=_.extend({},user)
    u.phoneNumbers=[];
    u.addresses=[]
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql('au moins un téléphone')
        //console.log(res.body.addresses[0])
        done()
      });
  });

  it('POST without phone for reminder /v1/users/<uid> should return 200',function(done){
    var u=_.extend({},user)
    u.addresses=[]
    u.phoneNumbers=[];
    u.save_reminder=true;
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.phoneNumbers.length.should.equal(0);
        done()
      });
  });


  it('POST  with phone  /v1/users/<uid> should return 200',function(done){
    var u=_.extend({},user)
    u.phoneNumbers=[{number:'076.378.89.98',what:'mobile'}]
    u.addresses=[]
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.phoneNumbers.length.should.equal(1);
        res.body.phoneNumbers[0].number.should.equal('076.378.89.98')
        done()
      });
  });


      
});

