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

describe("orders.find.shop", function(){
  var _ = require("underscore");


  var oneweek=Orders.findOneWeekOfShippingDay();
  var sellerDay=Orders.findCurrentShippingDay();
  var customerDay=oneweek[0];


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

  it("find open orders (4) filter by shop name 'Un autre shop'", function(done){
    var criteria={
      shop:"un-autre-shop",  /*super-shop*/
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(4)
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

        
  it("find open orders for next sellerDay filter by shop name 'Super shop'", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      when:sellerDay,
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(1)
      // order[0].print()
      done();
    });
  });

  it("find open orders for next customerDay filter by shop name 'Super shop'", function(done){
    var criteria={
      shop:"super-shop",  /*super-shop*/
      when:customerDay,
      closed:null

    }
    db.model('Orders').findByCriteria(criteria, function(err,order){
      should.not.exist(err)
      order.length.should.equal(0)
      done();
    });
  });

});

