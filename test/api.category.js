// Use a different DB for tests
var app = require("../app/index");




describe("api.categories", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');
  var Users = require('mongoose').model('Users');
  var async= require('async');

  var db = require('mongoose');
  var _=require('underscore');

  var cookie;

  var profile;
  

  // common befor/after
  before(function(done){
      // create 3 user and one shop
    db.model('Categories').remove({},function(){});
    db.model('Users').register("evaleto@gmail.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
        profile=user;
        done();
      });
  
  });
  

  after(function(done){
    db.model('Categories').remove({},function(){});
    db.model('Users').remove({},function(){done();});
  });
  



  it('GET /v1/category should return 200 and []',function(done){
    request(app)
      .get('/v1/category')
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
      
  });

  it('GET /v1/category/doesnt-exist return 400 doesnt exist',function(done){
    request(app)
      .get('/v1/category/doesnt-exist')
      .expect(400,done);
  });  

  it('POST /v1/category add cat when anonymous must return 401 ',function(done){
    request(app)
      .post('/v1/category')
      .send({name:'truc illégal'})
      .expect(401,done);
  });  
  
  it('POST /v1/category update when anonymous must return 401 ',function(done){
    request(app)
      .post('/v1/category/truc-illegal')
      .send({name:'truc illégal'})
      .expect(401,done);
  });  

  it('POST /login should return 200 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'mypwd', provider:'local' })
      .end(function(err,res){      
        res.should.have.status(200);
        cookie = res.headers['set-cookie'];
        done();        
      });
  });


  it('POST /v1/category add cat when signed and admin must return 200  ',function(done){
    request(app)
      .post('/v1/category')
      .set('cookie', cookie)
      .send({name:'truc légal'})
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });

  it('POST /v1/category/true-legal update cat when signed and admin must return 200  ',function(done){
    request(app)
      .post('/v1/category/truc-legal')
      .set('cookie', cookie)
      .send({group:'test'})
      .end(function(err, res){
        res.should.have.status(200);
        res.body.group.should.equal('test')
        done();
      });
  });

  it('GET /v1/category should return 200 and [].length==1',function(done){
    request(app)
      .get('/v1/category')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(1)
        done();
      });
  });

  it('GET /v1/category?group=tes should return 200 and [].length==1',function(done){
    request(app)
      .get('/v1/category')
      .send({group:'tes'})
      .end(function(err, res){
        //console.log(res.text)
        res.should.have.status(200);
        res.body.should.have.length(1)
        done();
      });
  });

  
  it('DEL /v1/category/true-legal  when signed and admin must return 200  ',function(done){
    request(app)
      .del('/v1/category/truc-legal')
      .set('cookie', cookie)
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
    
  it('GET /v1/category should return 200 and []',function(done){
    request(app)
      .get('/v1/category')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(0)
        done();
      });
  });
    
});

