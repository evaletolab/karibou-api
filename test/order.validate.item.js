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

function prepareOrderDates(){
  var today=new Date();
  // sunday is not a shipping day
  if (today.getDay()==0){
    toshortDay=Orders.jumpToNextWeekDay(today,1);
    okDay=Orders.jumpToNextWeekDay(today,3);
    return
  } 
  if (today.getDay()==4){
    toshortDay=Orders.jumpToNextWeekDay(today,today.getDay()+1);
    okDay=Orders.jumpToNextWeekDay(today,today.getDay()+4);
    return
  } 
  toshortDay=Orders.jumpToNextWeekDay(today,today.getDay()+1);
  okDay=Orders.jumpToNextWeekDay(today,today.getDay()+3);
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
    , payment="postfinance";

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


  it("Error:selected shipping date (eg. sunday) is not a shippable day", function(done){

    shipping.when=Orders.jumpToNextWeekDay(new Date(),0) // sunday is noz
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.include('shipping day is not available.')

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
      err.should.include('selected shipping day is to short')

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
      should.exist(err)
      err.should.include('Le prix de votre produit')
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
      should.exist(err)
      err.should.include("La quantité souhaitée n'est ")
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
      should.exist(err)
      err.should.include("quantité d'achat minimum est de 1")
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
      should.exist(err)
      err.should.include("la boutique a été désactivé")
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
      should.exist(err)
      err.should.include("la boutique est momentanément fermée")
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
      //console.log(err)
      should.exist(err)
      err.should.include("Ce produit n'est plus disponible")
      done();          
    });
  });    


  it.skip("Checking status after creating a new order ", function(done){

    shipping.when=okDay

    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))
    items.push(Orders.prepare(data.Products[1], 2, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      //console.log(order.items[0])
      should.not.exist(err)

      //
      // check fullfillments after creation
      order.fulfillments.status.should.equal('created')

      //
      // check financial status after creation
      should.not.exist(order.financial_status)

      //
      // check items fields, price and finalprice
      should.exist(order.items[0].part)
      //
      // checking discount price
      order.items[0].quantity.should.equal(1)
      order.items[0].price.should.equal(data.Products[0].pricing.discount)

      //
      // checking normal price
      order.items[1].quantity.should.equal(2)
      order.items[1].price.should.equal(data.Products[0].pricing.price*2)
      // console.log(JSON.stringify(order))
      done();          
    });
  });     

  it.skip("Error:an order with status created is no more available after a timeout", function(done){
    shipping.when=okDay

  });    

});

