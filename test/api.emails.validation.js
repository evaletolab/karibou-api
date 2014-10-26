// Use a different DB for tests
var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js"]);




describe("api.validate", function(){
  var request= require('supertest');
  var Users = require('mongoose').model('Users');
  var _=require('underscore');

  var cookie;


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });


  after(function(done){
    dbtools.clean(function(){
      done();
    })
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

  it('GET /v1/validate/18e16c6ba591b84b6fd69ce6e4c313a4a9c4057d should return 400 and error field',function(done){
    request(app)
      .get('/v1/validate/18e16c6ba591b84b6fd69ce6e4c313a4a9c4057d/pouet@ruc.com')
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('POST /login with ID should return 200',function(done){
  
    request(app)
      .post('/login')
      .send({ email:"evaleto@gluck.com", provider:'local', password:'password' })
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

  it('POST again should not create a new',function(done){
    request(app)
      .post('/v1/validate/create')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.email.should.equal("evaleto@gluck.com");
        res.body.uid.should.have.length(40);

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



  it('GET /v1/validate/<uid>/evaleto@poet.com should return 400 ',function(done){
    request(app)
      .get('/v1/validate/'+uid+'/evaleto@poet.com')
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });
  
  it('GET /v1/validate/<uid>/evaleto@gluck.com should return 200 ',function(done){
    request(app)
      .get('/v1/validate/'+uid+'/evaleto@gluck.com')
      .end(function(err,res){
        res.should.have.status(200);        
        done()
      });
  });

  it('GET re /v1/validate/<uid>/evaleto@gluck.com should return 400 ',function(done){
    request(app)
      .get('/v1/validate/'+uid+'/evaleto@gluck.com')
      .end(function(err,res){
        res.should.have.status(400);        
        res.text.should.include('n\'est plus disponible')
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
    
  it.skip('Cannot validate after a timeout ');
  it.skip('Cannot validate if email has changed');
  it.skip('Clean old orphan validation  (for timeout > 100 days)');
      
});

