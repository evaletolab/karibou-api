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

describe("orders.find.user", function(){
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

