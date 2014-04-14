// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.categories", function(){
  var request= require('supertest');
  var _=require('underscore');

  var cookie;
  
  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Products.js"],db,function(err){
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
      .send({ email: "evaleto@gmail.com", password:'password', provider:'local' })
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
      .send({name:'category légal'})
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });

  it('GET /v1/category type Catalog should return 200 and [].length==1',function(done){
    request(app)
      .get('/v1/category')
      .send({type:'Catalog'})
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(1)
        done();
      });
  });


  it('POST /v1/category add Catalog  must return 200  ',function(done){
    request(app)
      .post('/v1/category')
      .set('cookie', cookie)
      .send({name:'catalog special', type:'Catalog'})
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });

  it('POST /v1/category/category-legal update cat when signed and admin must return 200  ',function(done){
    request(app)
      .post('/v1/category/category-legal')
      .set('cookie', cookie)
      .send({group:'test'})
      .end(function(err, res){
        res.should.have.status(200);
        res.body.group.should.equal('test')
        done();
      });
  });

  it('GET /v1/category should return 200 and [catalog,category].length==2',function(done){
    request(app)
      .get('/v1/category')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(2)
        done();
      });
  });

  it('GET /v1/category?group=tes should return 200 and [].length==1',function(done){
    request(app)
      .get('/v1/category?group=tes')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(1)
        done();
      });
  });

  it.skip('DEL /v1/category/category-not-alone  return 400 when products are associated  ',function(done){
    request(app)
      .del('/v1/category/category-legal')
      .set('cookie', cookie)
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
  
  it('DEL /v1/category/category-legal  when signed and admin must return 200  ',function(done){
    request(app)
      .del('/v1/category/category-legal')
      .set('cookie', cookie)
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
    
  it('GET /v1/category should return 200 and [catalog].len==1',function(done){
    request(app)
      .get('/v1/category')
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.have.length(1)
        done();
      });
  });
     
});

