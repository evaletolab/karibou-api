// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.validate.js"]);

var Products=db.model('Products')
  , Orders=db.model('Orders')
  , today=new Date()
  , toshortDay
  , okDay;

// available shipping day for testing [1..6]
// check times in config.shop.order.timelimit (50 for testing)
function prepareOrderDates(){
  var today=new Date();
  if (today.getDay()==6){
    toshortDay=Orders.jumpToNextWeekDay(today,1);
    okDay=Orders.jumpToNextWeekDay(today,3);
    okDay.setHours(11,0,0,0)
    return
  } 
  toshortDay=Orders.jumpToNextWeekDay(today,today.getDay()+1);
  okDay=Orders.jumpToNextWeekDay(today,today.getDay()+3);
  okDay.setHours(11,0,0,0)
}
prepareOrderDates()

describe("orders.validate.item", function(){
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
    , payment={alias:((customer.id+"postfinance").hash().crypt()),method:"postfinance",number:'12xxxxxxx3456'};

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
  

  it("Error:item (discount) price in cart is no more available in shop", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))
    items[0].price=items[0].finalprice=33;


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(order.errors)
      order.errors[0]['1000001'].should.include('Le prix de votre produit')
      done();          
    });
  });    

  it("Error:order with any product out of stock", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[5], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(order.errors)
      order.errors[0]['1000006'].should.include('est plus en stock')
      done();          
    });
  });


  it("Error:item quantity in cart is no more available in shop", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[0], 100, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      //console.log(err)
      should.exist(order.errors)
      order.errors[0]['1000001'].should.include("La quantité souhaitée n'est ")
      done();          
    });

  });    

  it("Error:item quantity in cart is to small ", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[0], 0, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      //console.log(err)
      should.exist(order.errors)
      order.errors[0]['1000001'].should.include("quantité d'achat minimum est de 1")
      done();          
    });

  });    

  it("Error:item final price is not correct ", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[0], 2, ""))
    items[0].finalprice=3;


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      // console.log(err,order)
      should.exist(order.errors)
      order.errors[0]['1000001'].should.include("cet article (2)")
      done();          
    });

  });    
  it("Error:this product is not available because the shop is closed by kariboo", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[1], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(order.errors)
      order.errors[0]['1000002'].should.include("la boutique a été désactivé")
      done();          
    });
  });    

  it("Error:this product is not available because the shop is closed by the owner", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[2], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      //console.log(err)
      should.exist(order.errors)
      order.errors[0]['1000003'].should.include("la boutique est momentanément fermée")
      done();          
    });
  });    

  it("Error:this product is no more available in the shop", function(done){
    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[3], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(order.errors)
      order.errors[0]['1000004'].should.include("Ce produit n'est plus disponible")
      done();          
    });
  });    


   

});

