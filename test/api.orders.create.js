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
    okDay, toshortDay;


okDay=Orders.findNextShippingDay();
toshortDay=Orders.findCurrentShippingDay();

// select a shipping time
okDay.setHours(11,0,0,0)


describe("api.orders.create", function(){
  var request= require('supertest');
  var _ = require("underscore");

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


  it("POST /v1/orders create new order with missing fields ", function(done){

   var items=[]
      , customer=data.Users[0]
      , shipping={
          when:okDay
        }
      , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};

    var order={
      items:items,
      customer:customer,
      shipping:shipping,
      payment:payment
    }

    request(app)
      .post('/v1/orders')
      .send(order)
      .set('Content-Type','application/json')
      .set('cookie', cookie)
      .expect(400,done);

  });   


 it("POST /v1/orders create new order with some errors on the product selected", function(done){
    var items=[]
      , customer=data.Users[0]
      , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });
    items=_.sortBy(items,function(i){return i.title});

    shipping.when=okDay;

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
        should.exist(res.body.errors)
        res.body.errors[0]['1000002'].should.include("la boutique a été désactivé")
        done()
      });
  });    

 it("POST /v1/orders create new order with exceed of stock errors ", function(done){
    var items=[]
      , customer=data.Users[0]
      , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};

    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 26, "");
      if([1000002,1000003,1000004,1000005].indexOf(e.sku)==-1){
          items.push(e)
      }
    });

    items=_.sortBy(items,function(i){return i.title});

    shipping.when=okDay;

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
        should.exist(res.body.errors)
        res.body.errors[0]['1000001'].should.include("La quantité souhaitée")
        done()
      });
  });    

 it("POST /v1/orders create new order with wrong date return 400", function(done){
    var items=[]
      , customer=data.Users[0]
      , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};

    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 1, "");
      if([1000002,1000003,1000004,1000005].indexOf(e.sku)==-1){
          items.push(e)
      }
    });

    items=_.sortBy(items,function(i){return i.title});

    var when=toshortDay
    when.setHours(1,0,0,0)
    shipping.when=when;

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
      .expect(400,function(err,res){
        should.not.exist(err)
        res.text.should.include("date de livraison n'est plus disponible")
        done()
      });
  });    

 it("POST /v1/orders create new order with wrong time return 400", function(done){
    var items=[]
      , customer=data.Users[0]
      , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};

    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 1, "");
      if([1000002,1000003,1000004,1000005].indexOf(e.sku)==-1){
          items.push(e)
      }
    });

    items=_.sortBy(items,function(i){return i.title});

    var when=new Date(okDay)
    when.setHours(15,0,0,0)
    shipping.when=when;

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
      .expect(400,function(err,res){
        should.not.exist(err)
        res.text.should.include("livraison n'est pas valable")
        done()
      });
  });    


});

