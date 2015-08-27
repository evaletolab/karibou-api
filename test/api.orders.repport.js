var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var _ = require("underscore");
var request= require('supertest');
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]),
    Orders=db.model('Orders');

describe("api.orders.find", function(){
  before(function(done){

    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Orders.repport.js"],db,function(err){
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
    dbtools.clean(function(){    
      done();
    });    
  });

  //
  // keep session
  var cookie;

  it("login",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
      .end(function(e,res){
        should.not.exist(e)
        cookie = res.headers['set-cookie'];
        done()
      });
  })

  it('GET /v1/orders should return 401 for anonymous',function(done){
    request(app)
      .get('/v1/orders')
      .expect(401,done);
  });


  it('GET /v1/orders/invoices/shops/12/2014  list all open orders for admin',function(done){
    request(app)
      .get('/v1/orders/invoices/shops/12/2014')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        //res.body.length.should.equal(3)
        done()
      });  
  });  


  it('GET /v1/orders/invoices/shops/12/2014?shops=crocorient,les-fromages-de-gaetan  list all open orders for admin',function(done){
    request(app)
      .get('/v1/orders/invoices/shops/12/2014?shops=crocorient,les-fromages-de-gaetan')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        done()
      });  
  });  

  it('GET /v1/orders/invoices/shops/12/2014  list all open orders for admin',function(done){
    request(app)
      .get('/v1/orders/invoices/shops/12/2014')
      .expect(401,function(err,res){
        should.not.exist(err)
        //res.body.length.should.equal(3)
        done()
      });  
  });  




});

