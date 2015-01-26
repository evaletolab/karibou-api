// Use a different DB for tests
var app = require("../app");

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
      .send({ email: "evaleto@gluck.com", password:'password', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(200);
        res.body.roles.should.be.empty;
        res.body.shops.length.should.equal(1)
        cookie = res.headers['set-cookie'];
        done();        
      });
  });

  it('shops.update /v1/shops/mon-shop should return 401 (you are not the owner)',function(done){
    request(app)
      .post('/v1/shops/mon-shop')
      .set('cookie', cookie)
      .expect(401,done);
  });  


  it('shops.create /v1/shops should return 400 (shops limit exceed for no admin user)',function(done){
    var s=_.clone(data.Shops[0]);
    delete(s._id);
    s.name="Nouvelle boutique";
    s.urlpath="nouvelle-boutique";    
    request(app)
      .post('/v1/shops')
      .send(s)
      .set('cookie', cookie)
      .end(function(err,res){      
        res.should.have.status(401);
        done();
      });
  });  
 

  it('shops.delete /v1/shops/mon-shop should return 401 (you are not the owner)',function(done){
    request(app)
      .put('/v1/shops/mon-shop')
      .set('cookie', cookie)
      .end(function(err,res){      
        res.should.have.status(401);
        done();
      });
  });  

  it('shops.delete /v1/shops/mon-shop should return 400 (wrong protection password)',function(done){
    request(app)
      .put('/v1/shops/un-autre-shop')
      .send({password:'truc1234'})
      .set('cookie', cookie)
      .end(function(err,res){      
        res.should.have.status(400);
        res.text.should.include('mot de passe est incorrect')
        done();
      });
  });  


  it('shops.delete /v1/shops/mon-shop should return 200',function(done){
    request(app)
      .put('/v1/shops/un-autre-shop')
      .send({password:'password'})
      .set('cookie', cookie)
      .end(function(err,res){      
        res.should.have.status(200);
        done();
      });
  });  

  it('GET /v1/users/me should return user.shops.length==0 and status 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .end(function(err,res){      
        res.should.have.status(200);
        res.body.shops.length.should.equal(0)
        done();
      });

  });
      
});

