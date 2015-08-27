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

describe("orders.find.product", function(){
  var _ = require("underscore");

  var nextday=Orders.findNextShippingDay();
  var monday=Orders.jumpToNextWeekDay(new Date(),1);

  // on friday next shipping day equal monday
  // If days equal , orders count are different
  var dateEqual=(monday.getDay()==nextday.getDay())


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.repport.js"],db,function(err){
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

  it("find popular product for user evaleto", function(done){
    var criteria={
      email: "evaleto@gmail.com",
    }
    db.model('Products').findPopularByUser(criteria, function(err,products){
      should.not.exist(err)
      products.length.should.equal(4)
      done();
    });
  });

  it("find popular product for user delphine", function(done){
    var criteria={
      email: "delphine@gmail.com",
    }
    db.model('Products').findPopularByUser(criteria, function(err,products){
      should.not.exist(err)
      products.length.should.equal(3)
      done();
    });
  });

  it("find popular && liked product for user evaleto", function(done){
    var criteria={
      email: "evaleto@gmail.com",
      likes:[1000005]
    }
    db.model('Products').findPopularByUser(criteria, function(err,products){
      should.not.exist(err)
      products.length.should.equal(5)
      // products.should.containEql(1000005)
      // products.forEach(function (product) {
      //   console.log('------------',product.sku)
      // })
      done();
    });
  });


});

