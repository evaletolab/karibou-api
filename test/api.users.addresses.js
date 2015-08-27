// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users.addresses", function(){
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

   
  it('GET /v1/users/me should return 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .expect(200,done);

  });

  it('POST missing floor  /v1/users/<uid> should return 400',function(done){
    var u=_.clone(user)
    var address={
      geo:{
        lat: 46.1997473,
        lng: 6.1692497
      },
      location: "Genève-Ville",
      name: "famille olivier evalet",
      postalCode: "1208",
      streetAdress: "34 route de chene",
      primary:true
    }
    u.phoneNumbers=[{number:'076.378.89.98',what:'mobile'}]
    u.addresses=[]
    u.addresses.push(address)
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        //console.log(res.body.addresses[0])
        done()
      });
  });

  it('POST double primary  /v1/users/<uid> should return 400',function(done){
    var u=_.clone(user)
    var address={
      geo:{
        lat: 46.1997473,
        lng: 6.1692497
      },
      location: "Genève-Ville",
      name: "famille olivier evalet",
      postalCode: "1208",
      streetAdress: "34 route de chene",
      floor:1,
      primary:true
    }
    u.phoneNumbers=[{number:'076.378.89.98',what:'mobile'}]
    u.addresses=[]
    u.addresses.push(address)
    u.addresses.push(address)
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        //console.log(res.body.addresses[0])
        done()
      });
  });

  it('POST missing phone  /v1/users/<uid> should return 400',function(done){
    var u=_.clone(user)
    var address={
      geo:{
        lat: 46.1997473,
        lng: 6.1692497
      },
      location: "Genève-Ville",
      name: "famille olivier evalet",
      postalCode: "1208",
      streetAdress: "34 route de chene",
      floor:1,
      primary:true
    }
    u.addresses=[]
    u.addresses.push(address)
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('POST good addresse /v1/users/<uid> should return 200',function(done){
    var u=_.clone(user)
    var address={
      geo:{
        lat: 46.1997473,
        lng: 6.1692497
      },
      location: "Genève-Ville",
      name: "famille olivier evalet",
      postalCode: "1208",
      streetAdress: "34 route de chene",
      floor:2,
      primary:true
    }
    u.phoneNumbers=[{number:'076.378.89.98',what:'mobile'}]
    u.addresses=[]
    u.addresses.push(address)
    request(app)
      .post('/v1/users/'+user.id)
      .send(u)     
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        //console.log(res.body.addresses[0])
        done()
      });
  });




      
});

