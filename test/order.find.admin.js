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

  var oneweek=Orders.findOneWeekOfShippingDay();
  var sellerDay=Orders.findCurrentShippingDay();
  var customerDay=oneweek[0];

  before(function(done){


    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
        should.not.exist(err);        
        // Orders.printInfo()
        // Orders.find({}).exec(function(e,os){
        //   os.forEach(function(o){o.print()})
        // })
        
        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  it("find all orders (4)", function(done){

    var criteria={      
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(4)
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
      payment:"authorized",
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
      when:customerDay,
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

