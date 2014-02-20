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

  it("find all  orders", function(done){

    var criteria={      
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(3)
      done();
    });
  });

  it("find all open orders", function(done){
    var criteria={
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      // console.log(order[0].shipping.when)
      // console.log(order[1].shipping.when)
      done();
    });
  });

  it("find all closed (1) orders", function(done){
    var monday=Orders.jumpToNextWeekDay(new Date(),1);

    var criteria={
      closed:new Date(monday.getTime()-86400000*7)
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      done();
    });
  });

  it("find open orders for next shipping day", function(done){
    var criteria={
      nextShippingDay:true,
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      done();
    });
  });

  it("find open orders (1) for next monday", function(done){
    var criteria={
      when:Orders.jumpToNextWeekDay(new Date(),1),
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      done();
    });
  });


  it("find open orders (1) filter by shop name 'Super shop'", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      done();
    });
  });

  it("find open orders (2) filter by shop name 'Un autre shop'", function(done){
    var criteria={
      shop:"un-autre-shop",  /*super-shop*/
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      done();
    });
  });

  it("find open orders (1) for next day filter by shop name 'Super shop'", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      nextShippingDay:true,
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      done();
    });
  });

        
  it("find open orders (0) for next monday filter by shop name 'Super shop'", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      when:Orders.jumpToNextWeekDay(new Date(),1),
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(0)
      done();
    });
  });



  it.skip("find open orders for one shop with the shipping.when value == today", function(done){
    var criteria={
      shop:"un-shop",
      when:new Date()
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      // console.log(err,order)
      done();
    });
  });

});

