// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

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

/**
 * create order successfuly :
 *  - avoid multiple user create order in the same time
 *  - update all product quantity
 *  - send email
 */

describe("orders.create.success", function(){
  var _ = require("underscore");

  var nextday=Orders.findNextShippingDay();
  var monday=Orders.jumpToNextWeekDay(new Date(),1);

  // on friday next shipping day equal monday
  // If days equal , orders count are different
  var dateEqual=(monday.getDay()==nextday.getDay())


  before(function(done){
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



  it("Checking status after creating a new order ", function(done){
    var customer=data.Users[1];
    var shipping=customer.addresses[0];
    var payment="postfinance"
    var items=[];
    items.push(Orders.prepare(data.Products[0], 2, ""))
    items.push(Orders.prepare(data.Products[1], 3, ""))
    items.push(Orders.prepare(data.Products[3], 3, ""))

    shipping.when=okDay
    // shipping.when=Orders.jumpToNextWeekDay(new Date(),0) // sunday is noz



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
      order.items[0].quantity.should.equal(2)
      order.items[0].price.should.equal(data.Products[0].pricing.discount*2)

      //
      // checking normal price
      order.items[1].quantity.should.equal(3)
      order.items[1].price.should.equal(data.Products[0].pricing.price*3)
      // console.log(JSON.stringify(order))
      done();          
    });
  });     

  it.skip("Error:an order with status created is no more available after a timeout", function(done){
    shipping.when=okDay

  }); 
  

});

