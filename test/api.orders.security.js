// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("api.orders.security", function(){
  var request= require('supertest');
  var _ = require("underscore");

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js"],db,function(err){
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

  //
  // keep session
  var cookie;

  it("login",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
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

  it('GET /v1/orders should return 401 for non admin',function(done){
    request(app)
      .get('/v1/orders')
      .set('cookie', cookie)      
      .expect(401,done);
  });

  it('GET /v1/orders/users/123456 should return 401 for anonymous',function(done){
    request(app)
      .get('/v1/orders/users/123456')
      .expect(401,done);
  });

  it('GET /v1/orders/123456 should return 401 for anonymous',function(done){
    request(app)
      .get('/v1/orders/123456')
      .expect(401,done);
  });

  it('POST /v1/orders should return 401 for anonymous',function(done){
    request(app)
      .post('/v1/orders')
      .send({})
      .expect(401,done);
  });

  it('POST /v1/orders/123456 should return 401 for anonymous',function(done){
    request(app)
      .post('/v1/orders/123456')
      .send({})
      .expect(401,done);
  });

  it('GET /v1/orders/users/123456 should return 401 for non owner',function(done){
    request(app)
      .get('/v1/orders/users/123456')
      .set('cookie', cookie)      
      .expect(401,done);
  });

  it('GET /v1/orders/users/12345 should return 200 for owner',function(done){
    request(app)
      .get('/v1/orders/users/12345')
      .set('cookie', cookie)      
      .expect(200,done);
  });

  it('GET /v1/orders/shops/un-autre-shop should return 401 for anonymous',function(done){
    request(app)
      .get('/v1/orders/shops/un-shop')
      .expect(401,done);
  });

  it('GET /v1/orders/shops/un-autre-shop should return 200 for owner',function(done){
    request(app)
      .get('/v1/orders/shops/un-autre-shop')
      .set('cookie', cookie)      
      .expect(200,done);
  });

  it('GET /v1/orders/shops/un-shop should return 401 for non owner',function(done){
    request(app)
      .get('/v1/orders/shops/un-shop')
      .set('cookie', cookie)      
      .expect(401,done);
  });


 it("POST new /v1/orders should return 401 for payment that doesn't belongs to logged user", function(done){
    var items=[]
      , customer=data.Users[1]
      , payment={alias:((customer.id+"postfinance").hash().crypt()),issuer:"postfinance",number:'12xxxxxxx3456'};


    items.push(Orders.prepare(data.Products[0], 2, ""))
    items.push(Orders.prepare(data.Products[1], 3, ""))

    var order={
      items:items,
      shipping:{},
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(order)
      .set('cookie', cookie)
      .expect(401,function(err,res){
        should.not.exist(err)
        res.text.should.include("La méthode de paiement utilisée n'est pas valide")
        done()
      });
  }); 

});

