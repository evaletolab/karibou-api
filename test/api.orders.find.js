// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("api.orders.security", function(){
  var request= require('supertest');
  var _ = require("underscore");
  var nextShippingDay=Orders.findNextShippingDay();


  before(function(done){

    var $printOrders=function(os,nextday,monday){
        console.log('--- nextday',nextday)
        console.log('--- monday',monday)
        console.log("--- orders all    count ", os.length);

        var closed=0;os.forEach(function(o){if(o.closed)closed++})
        var paid  =0;os.forEach(function(o){if(o.payment.status==='paid')paid++})
        console.log("--- orders closed count ", closed);
        console.log("--- orders paid   count ", paid);
        os.forEach(function(o){
          console.log("--- oid %s  shipping.when ", o.oid, o.shipping.when);
          console.log("--- oid     fulfillments  ",  o.fulfillments.status);
          console.log("--- oid     closed        ",  o.closed);
          console.log("--- oid     user          ",  o.email);
          if(o.vendors)
          console.log("--- oid     vendors       ",  o.vendors.map(function(o){ return o.slug}).join(','));
        })    
    }
    $printOrders(data.Orders, nextShippingDay)

    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
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

  // it('GET /v1/orders should return 401 for non admin',function(done){
  //   request(app)
  //     .get('/v1/orders')
  //     .set('cookie', cookie)      
  //     .expect(200,function(err,res){
  //       for(var o in res.body){
  //         console.log(res.body[o].vendors)

  //       }
  //       should.not.exist(err)
  //       // should.exist(res.body.errors)
  //       // res.body.errors[0]['1000001'].should.include("La quantité souhaitée")
  //       done()
  //     });  
  // });

  // sugls: super-shop, un-autre-shop, mon-shop
  it('GET /v1/shops/mon-shop/orders?when=next list open orders for next shipping day ',function(done){
    request(app)
      .get('/v1/shops/mon-shop/orders?when=next')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(2)
        for(var o in res.body){
          (nextShippingDay).getTime().should.equal(new Date(res.body[o].shipping.when).getTime())
          // console.log("vendors",res.body[o].vendors)
        }
        done()
      });  
  });

  it('GET /v1/orders?when=next  list all open orders for admin',function(done){
    request(app)
      .get('/v1/orders?when=next')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(4)
        for(var o in res.body){
          (nextShippingDay).getTime().should.equal(new Date(res.body[o].shipping.when).getTime())
        }
        done()
      });  
  });  

  it('GET /v1/shops/mon-shop/orders?status=fail  ',function(done){
    request(app)
      .get('/v1/shops/mon-shop/orders?status=fail')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(0)
        for(var o in res.body){
        }
        done()
      });  
  });  

  it('GET /v1/shops/mon-shop/orders?status=close  ',function(done){
    request(app)
      .get('/v1/shops/mon-shop/orders?status=close')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(0)
        for(var o in res.body){
        }
        done()
      });  
  });  

  it('GET /v1/orders?status=close  ',function(done){
    request(app)
      .get('/v1/orders?status=close')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(1)
        for(var o in res.body){
        }
        done()
      });  
  }); 

  it.skip('GET /v1/orders?status=fail  ',function(done){
  });  

  


  it('GET /v1/shops/mon-shop/orders list all orders  ',function(done){
    request(app)
      .get('/v1/shops/mon-shop/orders')
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        res.body.length.should.equal(3)
        for(var o in res.body){
          // nextShippingDay.should.equals(res.body[o].shipping.when)
        }
        done()
      });  
  });

});

