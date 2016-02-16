// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");


describe("api.categories", function(){
  var request= require('supertest');

  
  before(function(done){

    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.more.js"],db,function(err){
        should.not.exist(err);

        // Orders.printInfo()
        //  Orders.find({}).exec(function(e,os){
        //    os.forEach(function(o){o.print()})
        //  })

        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(e){
      done()
    });
  });



  it('GET /seo/products/category/poissons',function(done){
    request(app)
      .get('/seo/products/category/poissons')
      .expect(200,done);
      
  });

  it('GET /seo/products',function(done){
    request(app)
      .get('/seo/products')
      .expect(200,done);
  });


  it('GET /seo/',function(done){
    request(app)
      .get('/seo/')
      .expect(200,done);
  });
          
});

