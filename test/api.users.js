// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
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

  it('POST /login should return 400 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'123456789', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(400);
        res.body.should.be.a.string;        
        done();        
      });
  });

  it('POST /login without email should return 400',function(done){  
    request(app)
      .post('/login')
      .send({ provider:'local', password:'password' })
      .end(function(err,res){
        res.should.have.status(400);
        done();        
      });
  });

  it('POST /login wrong data should return 400',function(done){  
    request(app)
      .post('/login')
      .send({ email:'oo@oo.com',provider:'local', password:'ppppp' })
      .end(function(err,res){
        res.should.have.status(400);
        res.body.should.be.a.string;        
        done();        
      });
  });

  it('POST /login without data should return 400',function(done){  
    request(app)
      .post('/login')
      .end(function(err,res){
        res.should.have.status(400);
        done();        
      });
  });

  var user;

  it('POST /login should return 200',function(done){  
    request(app)
      .post('/login')
      .send({ email:"evaleto@gluck.com", provider:'local', password:'password' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.address.should.equal("evaleto@gluck.com");
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
      .end(function(err,res){
        res.should.have.status(200);
        res.body.id.should.equal(user.id)
        done()
      });

  });
      
  it('user.get(12346) /v1/users/12346 should return 404',function(done){
    request(app)
      .get('/v1/users/12346')
      .set('cookie', cookie)
      .expect(404,done);
  });

  it('POST /v1/users/12346 for update should return 401',function(done){
    request(app)
      .post('/v1/users/12346')      
      .set('cookie', cookie)
      .expect(401,done);
  });

  it('POST /v1/users/12345 for update should return 400',function(done){
    request(app)
      .post('/v1/users/12345')      
      .set('cookie', cookie)
      .expect(400,done);
  });


  it('POST /v1/users/12345/password anonymous update password should return 401',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/12345/password')      
      .send({ email:"evaleto@gluck.com", new:'12345',current:'password'})
      .expect(401,done);
  });

  it('POST /v1/users/12347/password wrong user update password should return 401',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/12347/password')      
      .send({ email:"delphine@gmail.com", new:'12347',current:'password' })
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.containEql('pas le propriétaire de ce compte')
        res.should.have.status(401);
        done()
      });    
  });

  it('POST /v1/users/12345/password update with short password should return 400',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/12345/password')      
      .send({ email:"evaleto@gluck.com", new:'1234',current:'password' })
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql('passe doit contenir au moins')
        done()
      });    
  });

  it('POST /v1/users/12345/password update with wrong old password should return 400',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/12345/password')      
      .send({ email:"evaleto@gluck.com", new:'12345',current:'12345' })
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.containEql('mot de passe est incorrect (2)')
        res.should.have.status(400);
        done()
      });    
  });

  it('POST /v1/users/12345/password update password should return 200',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/12345/password')      
      .send({ email:"evaleto@gluck.com", new:'12345',current:'password' })
      .set('cookie', cookie)
      .expect(200,done);
  });


  it('POST /v1/users/12345 update hacked password fields should return 200 without changing password',function(done){
    var u=_.extend({},data.Users[0]);
    u.password={new:'1234567',copy:'password' }
    request(app)
      .post('/v1/users/12345')      
      .send(u)
      .set('cookie', cookie)
      .expect(200,done);
  });

  it('POST /login should return 400',function(done){  
    request(app)
      .post('/login')
      .send({ email:"evaleto@gluck.com", provider:'local', password:'1234567' })
      .expect(400,done);
  });


  it('valid user contains DISQUS SSO',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });    
  })


  it.skip('list users content without hash and salt',function(done){
  })  
});

