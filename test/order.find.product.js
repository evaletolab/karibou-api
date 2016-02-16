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
    // popular evaleto
    // 1000004 2
    // 1000002 4
    // 1000003 2
    // 1000001 1    
    var criteria={
      email: "evaleto@gmail.com",
      windowtime:2,
      minhit:1,
      maxcat:4,     
    }
    db.model('Products').findPopular(criteria, function(err,products){
      should.not.exist(err);
      products.length.should.equal(4)
      done();
    });
  });

  it("find popular product for user evaleto (maxcat=1)", function(done){
    // popular evaleto
    // 1000002 4
    // 1000003 2
    // 1000001 1    
    var criteria={
      email: "evaleto@gmail.com",
      windowtime:2,
      minhit:1,
      maxcat:1,     
    }
    db.model('Products').findPopular(criteria, function(err,products){
      should.not.exist(err);
      products.length.should.equal(3)
      done();
    });
  });
  it("find popular product for user delphine", function(done){
    // popular delphine
    // 1000003 1
    // 1000002 1
    // 1000004 1    
    var criteria={
      email: "delphine@gmail.com",
      windowtime:2,
      minhit:1,
      maxcat:4
    }
    db.model('Products').findPopular(criteria, function(err,products){
      should.not.exist(err);
      products.length.should.equal(3)
      done();
    });
  });

  it("find popular && liked product for user evaleto", function(done){
    // popular & likes evaleto
    // 1000005 love
    // 1000004 2
    // 1000002 4
    // 1000003 2
    // 1000001 1

    var criteria={
      email: "evaleto@gmail.com",
      likes:[1000005]
    }
    db.model('Products').findPopular(criteria, function(err,products){
      should.not.exist(err);
      products.length.should.equal(5)
      // products.should.containEql(1000005)
      // products.forEach(function (product) {
      //   console.log('------------',product.sku)
      // })
      done();
    });
  });

  it("find popular product for all users ", function(done){
    // TODO fixture is incomplet popular for all 
    // 1000004 2
    // 1000002 4
    // 1000003 2
    // 1000001 1
    var criteria={
      windowtime:2,
      minhit:1,
      maxcat:4
    }
    db.model('Products').findPopular(criteria, function(err,products){
      should.not.exist(err)
      products.length.should.equal(4)
      done();
    });
  });

});

