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
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js"],db,function(err){
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


  it.skip("POST /v1/orders ", function(done){

   var items=[]
      , customer=data.Users[0]
      , shipping={
          when:new Date()
        }
      , payment="postfinance";

    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .set('cookie', cookie)
      .send(o)
      .expect(401,done);

  });

  it.skip("/v1/orders", function(done){
    var items=[]
      , customer={}
      , shipping={
          when:Date.now()
        }
      , payment="postfinance";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(o)
      .expect(401,done);
 });  

 it.skip("/v1/orders", function(done){
    var items=[]
      , customer=data.Users[0]
      , shipping={
          when:Date.now()
        }
      , payment="postfinance";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(o)
      .expect(401,done);
  });  

  it.skip("/v1/orders", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            location: "Genève-Ville",
            postalCode: "1208",
            primary: true,
            region: "GE",
            when:Date.now()
        }
        , payment="postfinance";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .set('cookie', cookie)
      .send(o)
      .expect(401,done);
  });  

  it.skip("/v1/orders", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            location: "Genève-Ville",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "GE",
            when:Date.now()
        }
      , payment;


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(o)
      .expect(401,done);
  });    

 it.skip("/v1/orders", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            location: "Genève-Ville",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "GE",
            when:Date.now()
        }
      , payment="pooet";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });

    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(o)
      .expect(401,done);
  });    



});

