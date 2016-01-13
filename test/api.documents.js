// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js",'Products.js','Documents.js']);

// 12345 ==> evaleto@gluck.com 
// 12346 ==> evaleto@gmail.com (ADMIN)
// 12347 ==> delphine@gmail.com


// 12345 ==> Test product bio 1
// 12346 ==> Test product 2
// 12347 ==> Test product bio 3

describe("api.documents", function(){
  var request= require('supertest');

  var _=require('underscore');
  

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.js","../fixtures/Documents.js"],db,function(err){
        console.log(err)
        should.not.exist(err);
        done()
      });
    });      
  });

  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  it('GET /v1/documents/category/page should return 200',function(done){
    request(app)
      .get('/v1/documents/category/page')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.length.should.equal(1)
        done();
      });
  });

  it('GET /v1/documents/sku/12345 should return 200',function(done){
    request(app)
      .get('/v1/documents/sku/12345')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.length.should.equal(1)
        done();
      });
  });

  it('GET /v1/documents should return 401',function(done){
    request(app)
      .get('/v1/documents')
      .expect(401,done);
  });

  it('POST /v1/documents should return 401 for anonymous',function(done){
    var doc=_.extend({},data.Documents[0]);
    request(app)
      .post('/v1/documents')
      .set('Content-Type','application/json')
      .send(doc)
      .expect(401,done);
  });
  
  describe("authentication ", function(){
    var cookie, delphine, gluck;
    it("user admin",function (done) {
      request(app)
        .post('/login')
        .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gmail.com");
          cookie = res.headers['set-cookie'];
          should.exist(cookie);
          done();        
      });
    })

    it("user non admin delphine", function(done){
      request(app)
        .post('/login')
        .send({ email: "delphine@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("delphine@gmail.com");
          delphine = res.headers['set-cookie'];
          should.exist(delphine);
          done();        
      });
    });     

    it("user non admin gluck", function(done){
      request(app)
        .post('/login')
        .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gluck.com");
          gluck = res.headers['set-cookie'];
          should.exist(gluck);
          done();        
      });
    });     


     
    it('GET /v1/documents with owner should return 200',function(done){
      request(app)
        .get('/v1/documents')
        .set('cookie', gluck)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.length.should.equal(1)
          done()
        });
    });

    it('GET /v1/documents with no owner should return 200',function(done){
      request(app)
        .get('/v1/documents')
        .set('cookie', cookie)
        .end(function(err,res){
          res.should.have.status(200);
          res.body.length.should.equal(0)
          done()
        });
    });

    it('POST /v1/documents should return 400 missing fields  ',function(done){
      var doc=_.extend({},data.Documents[0]);
      request(app)
        .post('/v1/documents')
        .set('cookie', gluck)
        .set('Content-Type','application/json')
        .send({})
        .expect(400,done);
    });    

    it('POST /v1/documents should return 200   ',function(done){
      var doc=_.extend({},data.Documents[0]);
      request(app)
        .post('/v1/documents')
        .set('cookie', delphine)
        .set('Content-Type','application/json')
        .send(doc)
        .end(function(err,res){
          db.model('Documents').find({},function (e,docs) {
            console.log(err)
          done()
          })
        });
    });    

    it.skip('POST /v1/documents should return 200   ',function(done){
      var doc=_.extend({},data.Documents[0]);
      request(app)
        .post('/v1/documents')
        .set('cookie', delphine)
        .set('Content-Type','application/json')
        .send(doc)
        .end(function(err,res){
            console.log(err)
          done()
        });
    });    

    it.skip('POST update /v1/documents/1000002 non owner return 401  ',function(done){

    });    


    it.skip('POST update /v1/documents/1000002 home field should return 401 for not admin ',function(done){

    });    

    it.skip('POST update /v1/documents/1000002 change sku field should not be affected',function(done){

    });    
  });
      
  
    

  
});

