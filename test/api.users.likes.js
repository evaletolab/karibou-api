// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users.likes", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie, user;

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
  



  it('POST /login should return 200 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'password', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(200);
        res.body.roles.should.containEql('admin');
        cookie = res.headers['set-cookie'];
        user=res.body;
        done();        
      });
  });

   
  it('GET /v1/users/me should return 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.id.should.equal(user.id)
        done()
      });

  });

  it('user like wrong product should return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/like/01234567')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user like  /v1/users/me/like/'+data.Products[0].sku+' should return 200',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/like/'+data.Products[0].sku)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.likes.length.should.equal(1)
        res.body.likes[0].should.equal(data.Products[0].sku)
        done()
      });
  });

  it('GET /v1/users/me should return 1 like 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        // console.log(res.body.likes)
        res.body.likes.length.should.equal(1)
        res.body.likes[0].should.equal(data.Products[0].sku)
        done()
      });

  });


  it('user like  /v1/users/me/like/'+data.Products[0].sku+' should return 200',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/like/'+data.Products[0].sku)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.likes.length.should.equal(0)
        done()
      });
  });


      
});

