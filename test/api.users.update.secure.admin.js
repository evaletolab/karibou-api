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
  

  var user;

  it('POST /login should return 200',function(done){  
    request(app)
      .post('/login')
      .send({ email:"evaleto@gmail.com", provider:'local', password:'password' })
      .end(function(err,res){
        res.should.have.status(200);
        cookie = res.headers['set-cookie'];
        user=res.body;
        done();        
      });
  });

  it('POST update user, with different user.email.status be ok for admin',function(done){
    var u=data.Users[1];
    request(app)
      .post('/v1/users/'+user.id)      
      .send(_.extend({},u,{email:{status:false}}))
      .set('cookie', cookie)
      .end(function (err,res) {
        res.should.have.status(200);
        res.body.email.status.should.equal(false)
        res.body.email.address.should.equal(u.email.address)
        done();
      })
  });

  it('POST update other user with admin role, should return 200',function(done){
    var u=data.Users[0];
    request(app)
      .post('/v1/users/'+data.Users[0].id)      
      .send(u)
      .set('cookie', cookie)
      .end(function (err,res) {
        res.should.have.status(200);
        res.body.id.should.equal(data.Users[0].id)
        done();
      })
  });


});

