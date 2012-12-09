// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Users = mongoose.model('Users');

// why not using
// https://github.com/1602/jugglingdb




describe("Users API", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');

  beforeEach(function(done){

  	// create a new user
    var user=new Users({
		    provider:"twitter",
		    id:312528659,
		    photo:"https: //si0.twimg.com/profile_images/1385850059/oli-avatar-small_normal.png"
    });

    user.save(function(err){
      profile=user;
      profile.id.should.equal(312528659);
	    done();
    });

  });

  afterEach(function(done){
    Users.remove({}, function(o) {
      done();
    });
  });
  

  it('GET /v1/users/me should return 401',function(done){
    request(app)
      .get('/v1/users/me')
      .expect(401,done);
  });

  it.skip('POST /users should return 200',function(done){
    request()
      .post('/users')
      .set('Content-Type','application/json')
      .write(JSON.stringify({ username: 'test', password: 'pass' }))
      .expect(200,done);
  });
    
  
});

