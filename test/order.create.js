// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("orders.create", function(){
  var _ = require("underscore");
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
          when:Orders.jumpToNextWeekDay(new Date(),config.shop.order.weekdays[0])
      }
    , payment="postfinance",
    toshortDay,
    okDayBadTime;

  // available shipping day for testing [1..6]
  // check times in config.shop.order.timelimit (50 for testing)
  function prepareOrderDates(){
    var today=new Date();
    if (today.getDay()==6){
      toshortDay=Orders.jumpToNextWeekDay(today,1);
      okDayBadTime=Orders.jumpToNextWeekDay(today,3);
      // this not an available delevry time
      okDayBadTime.setHours(23,0,0,0)
      return
    } 
    toshortDay=Orders.jumpToNextWeekDay(today,today.getDay()+1);
    okDayBadTime=Orders.jumpToNextWeekDay(today,today.getDay()+3);
    okDayBadTime.setHours(23,0,0,0)

  }
  prepareOrderDates()


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

  




  it("Error on creation of a new order without items", function(done){
   var items=[]
      , customer=data.Users[0]
      , shipping={
          when:new Date()
        }
      , payment="postfinance";


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });  
  });

  it("Error on creation of an order without customer", function(done){
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


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });  

 it("Error on creation of an order without valid email", function(done){
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


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });  

  it("Error on creation of an order without shipping geo", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            primary: true,
            region: "Genève",
            when:Date.now()
        }
        , payment="postfinance";




    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      // console.log(err)
      should.exist(err)
      done();          
    });
  });  

  it("Error on creation of an order without gateway", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:Date.now()
        }
      , payment;


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });    

 it("Error on creation of an order with a bad gateway", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:Date.now()
        }
      , payment="pooet";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });    

  it("Error:selected shipping date (eg. sunday) is not a shippable day", function(done){

    shipping.when=Orders.jumpToNextWeekDay(new Date(),0) // sunday is noz
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))

    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.include("La date de livraison n'est pas valable")

      done();          
    });
  });    

  it("Error:selected shipping day is to short to prepare an order (date < config.shop.order.timelimit)", function(done){
    shipping.when=toshortDay;
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.include("Cette date de livraison n'est plus")

      done();          
    });
  });  

  it("Error:selected shipping time  is not availabe", function(done){

    shipping.when=okDayBadTime
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.include("L'heure de livraison n'est pas valable")

      done();          
    });
  });  
});

