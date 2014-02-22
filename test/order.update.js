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

  it("update finalprice, note, fulfillment for item sku:1000001 ", function(done){
    var oid=2000006;
    var item={      
      sku:1000001,
      finalprice:3.0,
      note:"j'ai mis 2 pièces",
      fulfillment:{status:"fulfilled"}
    }

    db.model('Orders').updateItem(oid,[item], function(err,order){
      should.not.exist(err)
      order.items[0].note.should.equal(item.note)
      order.items[0].fulfillment.status.should.equal(item.fulfillment.status)
      done();
    });
  });

  it("update finalprice, note, fulfillment for items sku:1000001,1000002 ", function(done){
    var oid=2000006;
    var items=[{      
          sku:1000001,
          finalprice:3.0,
          note:"j'ai mis 2 pièces",
          fulfillment:{status:"fulfilled"}
        },{      
          sku:1000002,
          finalprice:30.0,
          note:"nouveau prix",
          fulfillment:{status:"fulfilled"}
        }
    ]

    db.model('Orders').updateItem(oid,items, function(err,order){
      should.not.exist(err)
      order.items[0].note.should.equal(items[0].note)
      order.items[0].fulfillment.status.should.equal(items[0].fulfillment.status)

      order.items[1].note.should.equal(items[1].note)
      order.items[1].fulfillment.status.should.equal(items[1].fulfillment.status)

      done();
    });
  });

  

});

