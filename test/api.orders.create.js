// Use a different DB for tests
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
    okDay;

// available shipping day for testing [1..6]
// check times in config.shop.order.timelimit (50 for testing)
function prepareOrderDates(){
  var today=new Date();
  if (today.getDay()==6){
    toshortDay=Orders.jumpToNextWeekDay(today,1);
    okDay=Orders.jumpToNextWeekDay(today,3);
    // this not an available delevry time
    okDay.setHours(11,0,0,0)
    return
  } 
  toshortDay=Orders.jumpToNextWeekDay(today,today.getDay()+1);
  okDay=Orders.jumpToNextWeekDay(today,today.getDay()+3);
  okDay.setHours(11,0,0,0)

}
prepareOrderDates();

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
      , payment="postfinance";

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
      , customer=data.Users[1]
      , payment="postfinance";


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
      , customer=data.Users[1]
      , payment="postfinance";

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

 it("POST /v1/orders create new order with exceed of stock errors ", function(done){
    var items=[]
      , customer=data.Users[1]
      , payment="postfinance";

    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 60, "");
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



});

