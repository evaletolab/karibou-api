// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb
// http://www.scotchmedia.com/tutorials/express/authentication/2/03




describe("Users API", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');
  var Users = require('mongoose').model('Users');
  var profile;
  
  before(function(done){

    // registered user with password and linked to a provider
    Users.test(1234,'mypwd', function(e,u){
      profile=u;
      assert(!e);
      profile.id.should.equal(1234);
	    done();
    });     


  });

  after(function(done){
    Users.remove({}, function(o) {
      done();
    });
  });
  



  it('GET /v1/users/me should return 401',function(done){
    request(app)
      .get('/v1/users/me')
      .expect(401,done);
  });

  it('POST /login should return 302 on /',function(done){
  
    request(app)
      .post('/login')
      .send({ id: 1234, password:'mypwd' })
      .end(function(err,res){
        res.should.have.status(302);
//        console.log(res.text);
        res.headers.location.should.equal('/');
        done();        
      });
  });
    

  it('POST /login should return 302 on /login',function(done){
    request(app)
      .post('/login')
      .send({ id: 123456, password:'mypwd' })
      .end(function(err,res){      
        res.should.have.status(302);
        res.headers.location.should.equal('/login');
        
        done();        
      });
  });
  
});

