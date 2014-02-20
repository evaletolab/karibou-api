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

describe("orders.find", function(){
  var _ = require("underscore");


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

  it("find all open orders", function(done){
    var criteria={
      shop:"un-autre-shop",
      status:""
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      done();
    });
  });

  it("find open orders for one shop with the shipping.when value == the nextShippingDay ", function(done){
    var criteria={
      shop:"un-autre-shop"
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      console.log(err,order)
      done();
    });
  });

  it("find open orders for one shop with the shipping.when value == today", function(done){
    var criteria={
      shop:"un-autre-shop",
      when:new Date()
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      console.log(err,order)
      done();
    });
  });

});

