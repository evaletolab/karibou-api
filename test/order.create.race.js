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
  , okDay
  , timelimitH=config.shop.order.timelimitH
  , timelimit=config.shop.order.timelimit
  , timeoutAndNotPaid=config.shop.order.timeoutAndNotPaid;





/**
 * create order successfuly :
 *  - avoid multiple user create order in the same time
 *  - update all product quantity
 *  - send email
 */

describe("orders.create.race", function(){
  var _ = require("underscore");


  okDay=Orders.findNextShippingDay();
  toshortDay=Orders.findCurrentShippingDay();

  // select a shipping time
  okDay.setHours(11,0,0,0)




  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
        should.not.exist(err);
        data.Products[0].pricing.stock=11
        data.Products[1].pricing.stock=13
        data.Products[2].pricing.stock=12

        // Orders.find({}).exec(function(e,os){
        //   os.forEach(function(o){
        //     o.print();
        //   })
        // })

        //
        // create race condition by commenting this block
        db.model('Sequences').nextOrder(function(){
          done()
        })
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
    data.Products[0].pricing.stock=10
    data.Products[1].pricing.stock=10
    data.Products[2].pricing.stock=10
    config.shop.order.timelimitH=timelimitH;
    config.shop.order.timelimit=timelimit;
    config.shop.order.timeoutAndNotPaid=timeoutAndNotPaid;
    done();
    });    
  });



  it("race condition when creating parallel orders ", function(done){
    var payment={alias:((data.Users[1].id+"").hash().crypt()),issuer:"tester",number:'12xxxxxxx3456'};
    // console.log(data.Products)
    require("async").parallelLimit([
      function(cb){
        var shipping=data.Users[1].addresses[0];
        shipping.when=okDay
        var items=[];
        items.push(Orders.prepare(data.Products[0], 2, ""))
        items.push(Orders.prepare(data.Products[1], 3, ""))
        items.push(Orders.prepare(data.Products[3], 3, ""))
        Orders.create(items, data.Users[1], shipping, payment, cb);
      },
      function(cb){
        var shipping=data.Users[0].addresses[0];
        shipping.when=okDay
        var items=[];
        items.push(Orders.prepare(data.Products[0], 1, ""))
        items.push(Orders.prepare(data.Products[1], 3, ""))
        items.push(Orders.prepare(data.Products[2], 2, ""))
        Orders.create(items, data.Users[0], shipping, payment, cb);
      },
      function(cb){
        var shipping=data.Users[0].addresses[0];
        shipping.when=okDay
        var items=[];
        items.push(Orders.prepare(data.Products[1], 3, ""))
        items.push(Orders.prepare(data.Products[2], 2, ""))
        Orders.create(items, data.Users[1], shipping, payment, cb);
      },
      function(cb){
        var shipping=data.Users[1].addresses[0];
        shipping.when=okDay
        var items=[];
        items.push(Orders.prepare(data.Products[1], 3, ""))
        items.push(Orders.prepare(data.Products[2], 2, ""))
        Orders.create(items, data.Users[1], shipping, payment, cb);
      }
    ],4, function(err,orders){

      setTimeout(function(){
        Orders.findByTimeoutAndNotPaid(function(err,orders){

          require('async').eachLimit(orders,1,function(o,cb){
            o.print()
            o.rollbackProductQuantityAndSave("timeout",function(err,o){

              //
              // after rollback order status is failure
              o.fulfillments.status.should.equal("failure");
              cb(err)
            })

          },function(err,oos){
            should.not.exist(err)

            //
            // check that product stock are back to original values
            Products.find({}).exec(function(e,products){
              products.forEach(function(product){
                var p=_.find(data.Products,function(p){return p.sku==product.sku;})
                //
                // X fingers here
                p.pricing.stock.should.equal(product.pricing.stock)

              })
              done();
            })

          })

        })
      },config.shop.order.timeoutAndNotPaid*1800)
    });
  });   


});

