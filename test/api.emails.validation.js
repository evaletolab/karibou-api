// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// http://www.scotchmedia.com/tutorials/express/authentication/2/03




describe("api.validate", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');
  var Users = require('mongoose').model('Users');
  var async= require('async');

  var db = require('mongoose');
  var _=require('underscore');
  var fx = require('./fixtures/products');

  var cookie;


  // common befor/after
  before(function(done){
    fx.create_all(function(err,s,c,m,p){
      assert(!err);
      done()
    })
  
  });
  

  after(function(done){
    fx.clean(function(){    
      db.model('Users').remove({},function(){;});
      db.model('Emails').remove({},function(){done();});
    });
  });
  



  it('GET /v1/validate should return 401',function(done){
    request(app)
      .get('/v1/validate')
      .expect(401,done);
  });

  it('POST /v1/validate/create should return 401',function(done){
    request(app)
      .post('/v1/validate/create')
      .send({email:'pouet@ruc.com',uid:012345})
      .expect(401,done);
  });

  it('GET /v1/validate/18e16c6ba591b84b6fd69ce6e4c313a4a9c4057d should return 200 and error field',function(done){
    request(app)
      .post('/v1/validate/18e16c6ba591b84b6fd69ce6e4c313a4a9c4057d')
      .send({ email:"evaleto@gluck.com"})
      .end(function(err,res){
        res.should.have.status(200);
        res.body.error.should.be.a.string;
        done()
      });
  });

  it('POST /login with ID should return 200',function(done){
  
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

  it('GET /v1/validate should return 200 and 0 validation',function(done){
    request(app)
      .get('/v1/validate')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.should.be.an.array;
        res.body.length.should.equal(0);
        done()
      });
  });   

  var uid;
  it('POST /v1/validate/create should return 200',function(done){
    request(app)
      .post('/v1/validate/create')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.should.equal("evaleto@gluck.com");
        res.body.uid.should.have.length(40);
        uid=res.body.uid;

        done()
      });
  });


  it('GET /v1/validate should return 200 ad 1 validation',function(done){
    request(app)
      .get('/v1/validate')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);

        res.body.should.be.an.array;
        res.body.should.have.length(1);
        done()
      });
  });   
  
  it('GET /v1/validate/<uid> should return 200 ',function(done){
    request(app)
      .post('/v1/validate/'+uid)
      .end(function(err,res){
        //console.log(res.text)
        res.should.have.status(200);
        res.body.email.status.should.equal(true)
        done()
      });
  });
  
  it('GET /v1/validate should return 200 ad 0 validation',function(done){
    request(app)
      .get('/v1/validate')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);

        res.body.should.be.an.array;
        res.body.should.have.length(0);
        done()
      });
  });   
    
  it.skip('Cannot validate after a timeout (>48h)');
  it.skip('Cannot validate if email has changed');
  it.skip('Clean old orphan validation  (for timeout > 100 days)');
      
});

