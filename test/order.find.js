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

describe("orders.find", function(){
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

  it("find all orders (3)", function(done){

    var criteria={      
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(3)
      done();
    });
  });

  it.skip("find an list of orders (2100000,2100006)", function(done){

    var criteria={      
      oid:'2100000,2100007'
    }

    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      order[0].oid.should.equal(2100000)
      order[1].oid.should.equal(2100006)
      done();
    });
  });

  it("find all open orders (2)", function(done){
    var criteria={
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      // order.forEach(function(o){
      //   console.log(o.shipping.when)
      // })
      done();
    });
  });

  it("find all open orders that are paid (0)", function(done){
    var criteria={
      payment:"paid",
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
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

  it("find open orders (1) for next shipping day", function(done){
    var criteria={
      nextShippingDay:true,
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(dateEqual?2:1)
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
      order.length.should.equal(dateEqual?2:1)
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

  it("find open orders (1) for next shipping day filter by shop name 'Super shop'", function(done){
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

  it("when filterByShop, only those items are exported ", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      nextShippingDay:true,
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err);

      order.length.should.equal(1);
      order=db.model('Orders').filterByShop(criteria.shop,order)

      order[0].vendors.length.should.equal(1);
      order[0].vendors[0].slug.should.equal(criteria.shop)

      for(var i in order[0].items){
        order[0].items[i].vendor.should.equal(criteria.shop)
      }
      done();
    });
  });
  it.skip("find open orders (1) for next shipping day filter by shop name and with status paid+partial", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      nextShippingDay:true,
      paid:true,
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
      order.length.should.equal(dateEqual?1:0)
      done();
    });
  });

  it("find all orders (2) for user evaleto", function(done){
    var criteria={
      user: 12346,
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(2)
      order[0].customer.id.should.equal(12346)
      done();
    });
  });

  it("find open orders (1) for user evaleto", function(done){
    var criteria={
      user: 12346,
      closed:null
    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order[0].customer.id.should.equal(12346)
      order.length.should.equal(1)
      done();
    });
  });


});

