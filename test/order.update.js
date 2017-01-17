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
 * update order :
 *  - update the final price
 *  - update the note
 */

describe("orders.update", function(){
  var _ = require("underscore");

  var nextday=Orders.findNextShippingDay();
  var monday=Orders.jumpToNextWeekDay(new Date(),1);

  // on friday next shipping day equal monday
  // If days equal , orders count are different
  var dateEqual=(monday.getDay()==nextday.getDay())

  var events=[];


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      

    require('../app/bus').on('order.update.items',function(err, order, items){
      //
      // this is a test behavior, because the event will catch actions to the next test
      should.not.exist(err)
      should.exist(order)

      events.push({oid:order.oid,items:_.flatten(items)});

    });

  });

  
  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  it("Error when update finalprice on not valid order(paid&&created) ", function(done){
    // orders 2100000, 2000006 are pending
    // orders 2100000 is closed
    // orders 2000007,8,9 are paid, created
    var oid=2000006;
    var item={      
      sku:1000001,
      finalprice:3.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{status:"fulfilled"}
    }

    db.model('Orders').updateItem(oid,[item], function(err,order){
      should.exist(err)
      done();
    });
  });

  it("update finalprice, note, fulfillment for item sku:1000001 ", function(done){
    var oid=2000007;
    var item={      
      sku:1000002,
      finalprice:6.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{status:"failure"}
    }

    db.model('Orders').updateItem(oid,[item], function(err,order){
      should.not.exist(err)
      order.items[1].note.should.equal(item.note)
      order.items[1].fulfillment.status.should.equal(item.fulfillment.status)
      // order.items[1].finalprice.should.equal(0)
      done();
    });
  });

  it("update issue for item sku:1000001 doesn not change issue ", function(done){
    var oid=2000007;
    var item={      
      sku:1000002,
      finalprice:6.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{issue:"issue_missing_product"}
    }

    db.model('Orders').updateItem(oid,[item], function(err,order){
      should.not.exist(err)
      should.not.exist(order.items[1].fulfillment.issue)
      done();
    });
  });

  it("update issue for item sku:1000001  ", function(done){
    var oid=2000007;
    var item={      
      sku:1000002,
      finalprice:6.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{issue:"issue_missing_product"}
    }

    db.model('Orders').updateIssue(oid,[item], function(err,order){
      should.not.exist(err)
      order.items[1].fulfillment.issue.should.equal("issue_missing_product")
      done();
    });
  });


  it("remove issue for item sku:1000001 ", function(done){
    var oid=2000007;
    var item={      
      sku:1000002,
      finalprice:6.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{issue:"issue_no_issue"}
    }

    db.model('Orders').updateIssue(oid,[item], function(err,order){
      should.not.exist(err)
      should.not.exist(order.items[1].fulfillment.issue)
      done();
    });
  });

  it("update issue after limit of times get an error  ", function(done){
    config.shared.issue.ttl=2;
    var oid=2100000;
    var item={      
      sku:1000002,
      finalprice:6.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{issue:"issue_missing_product"}
    }

    db.model('Orders').updateIssue(oid,[item], function(err,order){
      console.log(err)
      should.exist(err);
      err.should.containEql('une erreur après nb jours')
      config.shared.issue.ttl=7;
      done();
    });
  });

  it("update items finalprice, note, fulfillment ", function(done){
    var oid=2000007;
    var items=[{      
          sku:1000002,
          finalprice:30.0,
          note:"nouveau prix",
          fulfillment:{status:"fulfilled"}
        },{      
          sku:1000004,
          finalprice:8.0,
          note:"correction poids ",
          fulfillment:{status:"fulfilled"}
        }
    ]

    db.model('Orders').updateItem(oid,items, function(err,order){
      should.not.exist(err)
      order.items[1].note.should.equal(items[0].note)
      order.items[1].fulfillment.status.should.equal(items[0].fulfillment.status)
      // check price
      order.items[1].finalprice.should.not.equal(order.items[1].price)

      order.items[0].note.should.equal(items[1].note)
      order.items[0].fulfillment.status.should.equal(items[1].fulfillment.status)
      // check price
      order.items[0].finalprice.should.not.equal(order.items[2].price)

      // check price and finalprice
      order.items[0].finalprice.should.equal(items[1].finalprice)
      done()
    });


  });

  it("get notified when updating items order ", function(done){
    var oid=2000007;
    var items=[{      
          sku:1000003,
          fulfillment:{status:"fulfilled"}
        }
    ]

    db.model('Orders').updateItem(oid,items, function(err,order){
      should.not.exist(err)
      // check price and finalprice
      order.items[2].finalprice.should.equal(order.items[2].price*order.items[2].quantity)
      done()

    });


  });  


  it.skip("get error when updating fulfilled order ", function(done){
    var oid=2000007;
    var items=[{      
          sku:1000003,
          fulfillment:{status:"failure"}
        }
    ]

    db.model('Orders').updateItem(oid,items, function(err,order){
      should.exist(err)
      err.should.containEql('Impossible de modifier une commande')
      done()
    });


  });  


  it("get notified on update items", function(done){
      console.log('!!! ----------- VALIDATE THE TEST HERE -------------- :) !!!')
      events.length.should.equal(4)
      done();

  });

});

