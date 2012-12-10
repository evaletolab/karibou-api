// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb




describe("Users API", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');



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

