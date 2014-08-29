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


/**
 * find order with criteria:
 *  - closed(all or with date), open
 *  - filter by shipping date
 *  - filter by shop slug
 */

describe("orders.find.admin", function(){
  var _ = require("underscore");

  var nextday=Orders.findNextShippingDay();
  var monday=Orders.jumpToNextWeekDay(new Date(),((nextday.getDay()==1)?2:1));

  // on friday next shipping day equal monday
  // If days equal , orders count are different
  var dateEqual=(monday.getDay()==nextday.getDay())


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
    // $printOrders(data.Orders, nextday,monday)


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

  it("find all orders (5)", function(done){

    var criteria={      
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(5)
      done();
    });
  });

  it.skip("find an list of orders (2100000,2100006)", function(done){

    var criteria={      
      oid:'2100000,2100006'
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      order[0].oid.should.equal(2100000)
      order[1].oid.should.equal(2100006)
      done();
    });
  });

  it("find all open orders ", function(done){
    var criteria={
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(4)
      // order.forEach(function(o){
      //   console.log(o.shipping.when)
      // })
      done();
    });
  });

  it("find all open orders that are paid ", function(done){
    var criteria={
      payment:"paid",
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(3)
      done();
    });
  });
  it("find all closed orders", function(done){
    var criteria={
      closed:true
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
      order.length.should.equal(3)
      done();
    });
  });

  it("find open orders for next monday", function(done){
    var criteria={
      when:monday,
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      // order.forEach(function(o){console.log(o.oid,o.shipping.when)})
      order.length.should.equal(1)
      done();
    });
  });




});

