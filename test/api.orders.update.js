var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders'),
    shipping={
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
        when:null
    },
    okDay, 
    toshortDay,
    weekdays=config.shop.order.weekdays;


okDay=Orders.findNextShippingDay();
toshortDay=Orders.findCurrentShippingDay();

// select a shipping time
okDay.setHours(11,0,0,0)


describe("api.orders.create", function(){
  var request= require('supertest');
  var _ = require("underscore");
  var orderId;

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.validate.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      config.shop.order.weekdays=weekdays;
      done();
    });    
  });

  //
  // keep session
  var cookie, evaleto;

  it("login gluck",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
      .end(function(e,res){
        should.not.exist(e)
        cookie = res.headers['set-cookie'];
        done()
      });
  })


  it("login evaleto",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
      .end(function(e,res){
        should.not.exist(e)
        evaleto = res.headers['set-cookie'];
        done()
      });
  })





 it("POST /v1/orders create new order get right payment status 'authorized' and 'reserved'", function(done){
    var items=[]
      , customer=data.Users[0]
      , payment={
        alias:((customer.id+"postfinance").hash().crypt()),
        issuer:"postfinance",
        number:'12xxxxxxx3456'
      };


    data.Products.forEach(function(product){
      //
      // prepare is a private helper fundction for testing purpose
      var e=Orders.prepare(product, 1, "");
      if([1000001,1000006,1000007].indexOf(e.sku)!==-1){
          // console.log('------------------',e)
          items.push(e)
      }
    });

    shipping.when=new Date(okDay);

    var order={
      items:items,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .set('Content-Type','application/json')
      .send(order)
      .set('cookie', cookie)
      .expect(200,function(err,res){
        should.not.exist(err)
        should.not.exist(res.body.errors)
        should.not.exist(res.body.cancel)
        should.not.exist(res.body.closed)
        res.body.payment.status.should.equal('authorized')
        res.body.fulfillments.status.should.equal('reserved')
        var tx=JSON.parse(res.body.payment.transaction.decrypt())
        tx.should.have.property('operation')
        tx.should.have.property('payId')
        tx.should.have.property('orderId')
        tx.should.have.property('email')
        tx.should.have.property('amount')
        // db.model('Orders').print(res.body)
        orderId=res.body.oid
        done()
      });
  });    


  it("POST /v1/orders/:id/items evaleto update item should change the fulfillment to fulfilled/failure", function(done){
    var items=[]
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 1, "");
      // gluck owner
      if([1000001].indexOf(e.sku)!==-1){
          items.push(e)
      }
    });

    request(app)
      .post('/v1/orders/'+orderId+'/items')
      .set('Content-Type','application/json')
      .send(items)
      .set('cookie', evaleto)
      .expect(200,function(err,res){
        should.not.exist(err)
        should.not.exist(res.body.errors)
        should.not.exist(res.body.cancel)
        should.not.exist(res.body.closed)
        res.body.payment.status.should.equal('authorized')
        res.body.fulfillments.status.should.equal('partial')
        done()
      });
  });    


  it("POST /v1/orders/:id/items update unknnow item generate an ERROR", function(done){
    var items=[]
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 1, "");
      if([1000001,1000003].indexOf(e.sku)!==-1){
          items.push(e)
      }
    });

    request(app)
      .post('/v1/orders/'+orderId+'/items')
      .set('Content-Type','application/json')
      .send(items)
      .set('cookie', evaleto)
      .expect(401,function(err,res){
        console.log('FIXME error here is not appropriate : 400 with unknow item')
        should.not.exist(err)
        res.text.should.include('appartient pas à votre boutique')

        done()
      });
  }); 

  it("POST /v1/orders/:id/items gluck update item should change the fulfillment to fulfilled/failure", function(done){
    var items=[]
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 1, "");
      // gluck owner
      if([1000001,1000007].indexOf(e.sku)!==-1){
          items.push(e)
      }
    });

    request(app)
      .post('/v1/orders/'+orderId+'/items')
      .set('Content-Type','application/json')
      .send(items)
      .set('cookie', evaleto)
      .expect(200,function(err,res){
        should.not.exist(err)
        should.not.exist(res.body.errors)
        should.not.exist(res.body.cancel)
        should.not.exist(res.body.closed)
        res.body.payment.status.should.equal('authorized')
        res.body.fulfillments.status.should.equal('partial')
        done()
      });
  });    



  it.skip("POST /v1/orders/:id/items not owner generate an ERROR", function(done){
    var items=[]
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 1, "");
      if([1000003,1000005].indexOf(e.sku)!==-1){
          items.push(e)
      }
    });

    request(app)
      .post('/v1/orders/'+orderId+'/items')
      .set('Content-Type','application/json')
      .send(items)
      .set('cookie', cookie)
      .expect(400,function(err,res){
        should.exist(err)
        done()
      });
  });    

  it.skip("POST /v1/orders/:id/items update lasts items finalize this order", function(done){
    var items=[]
    data.Products.forEach(function(product){
      var e=Orders.prepare(product, 1, "");
      if([1000005].indexOf(e.sku)!==-1){
          items.push(e)
      }
    });

    request(app)
      .post('/v1/orders/'+orderId+'/items')
      .set('Content-Type','application/json')
      .send(items)
      .set('cookie', cookie)
      .expect(200,function(err,res){
        should.not.exist(err)
        should.not.exist(res.body.errors)
        should.not.exist(res.body.cancel)
        should.not.exist(res.body.closed)
        res.body.payment.status.should.equal('authorized')
        res.body.fulfillments.status.should.equal('fulfilled')
        res.body.items.forEach(function(item){
          // item.should
        });

        done()
      });
  });    



});

