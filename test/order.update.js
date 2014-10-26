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
      fulfillment:{status:"fulfilled"}
    }

    db.model('Orders').updateItem(oid,[item], function(err,order){
      should.not.exist(err)
      order.items[1].note.should.equal(item.note)
      order.items[1].fulfillment.status.should.equal(item.fulfillment.status)
      done();
    });
  });

  it("update items finalprice, note, fulfillment and get notified", function(done){
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

    });

    require('../app/bus').on('order.update.items',function(err, order, items){
      //
      // this is a test behavior, because the event will catch actions to the next test
      if(items.length!==2)return;
      should.not.exist(err)
      should.exist(order)
      done();

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

    });

    require('../app/bus').on('order.update.items',function(err, order, items){
      should.not.exist(err)
      should.exist(order)
      should.exist(items)
      done();
    })

  });  


  it("get error when updating fulfilled order ", function(done){
    var oid=2000007;
    var items=[{      
          sku:1000003,
          fulfillment:{status:"failure"}
        }
    ]

    db.model('Orders').updateItem(oid,items, function(err,order){
      should.exist(err)
      err.should.include('Impossible de modifier une commande')
      done()
    });


  });  

});

