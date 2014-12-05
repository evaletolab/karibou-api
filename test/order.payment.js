// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.payment.js"]);

var Products=db.model('Products')
  , payment = require('../app/payment')
  , Orders=db.model('Orders')
  , today=new Date()
  , toshortDay
  , okDay
  , timelimitH=config.shop.order.timelimitH
  , timelimit=config.shop.order.timelimit
  , timeoutAndNotPaid=config.shop.order.timeoutAndNotPaid;





describe("orders.payment", function(){
  var _ = require("underscore");





  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.payment.js"],db,function(err){
        should.not.exist(err);
        // Orders.find({}).exec(function(e,os){
        //   os.forEach(function(o){
        //     o.print();
        //   })
        // })

        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      config.shop.order.timelimitH=timelimitH;
      config.shop.order.timelimit=timelimit;
      config.shop.order.timeoutAndNotPaid=timeoutAndNotPaid;
      done();
    });    
  });

  // order state is failure
  it("Voided state can not be changed", function(done){
    var order=data.Orders[0];
    order.payment.status="voided";
    order.fulfillments.status="created";
    payment.for(order.payment.issuer).authorize(order)
      .fail(function(err){
        should.exist(err.message)
        err.message.should.include("Impossible d'autoriser une commande")
        done()        
      })
  });   

  // order state is failure
  it("Refund state can not be changed", function(done){
    var order=data.Orders[0];
    order.payment.status="refunded";
    order.fulfillments.status="created";
    payment.for(order.payment.issuer).authorize(order)
      .fail(function(err){
        should.exist(err.message)
        err.message.should.include("Impossible d'autoriser une commande")
        done()        
      })
  });   

  // order state become (reserved,partial,fulfilled) or failure
  it.skip("Pending state can be changed to auth or voided", function(done){
    done()
  });   

  it.skip("Authorized state can be changed to Paid or voided", function(done){
    done()
  });   

  it.skip("Paid state can be changed to Refund", function(done){
    done()
  });   

  it.skip("Authorized state can be changed to Paid or voided", function(done){
    done()
  });   

});

