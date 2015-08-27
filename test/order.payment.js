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
    config.shop.order.gateway[5].fees=0.02
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
    config.shop.order.gateway[5].fees=0
    dbtools.clean(function(){    
      config.shop.order.timelimitH=timelimitH;
      config.shop.order.timelimit=timelimit;
      config.shop.order.timeoutAndNotPaid=timeoutAndNotPaid;
      done();
    });    
  });


  it("Compute issuer fees", function(done){
    // payment.fees('postfinance card',1).should.equal(config.shop.order.gateway[0].fees);
    // payment.fees('postfinance card',(1).toFixed(2)).should.equal(config.shop.order.gateway[0].fees);
    // payment.fees('postfinance card',(36.10).toFixed(2)).toFixed(2).should.equal((config.shop.order.gateway[0].fees*36.10).toFixed(2));
    // payment.fees('postfinance card','1.00').should.equal(config.shop.order.gateway[0].fees);
    payment.fees('american express','10').should.equal(config.shop.order.gateway[1].fees*10);
    payment.fees('visa',1).should.equal(config.shop.order.gateway[2].fees);
    payment.fees('paypal',1).should.equal(config.shop.order.gateway[4].fees);
    payment.fees('invoice',1).should.equal(config.shop.order.gateway[5].fees);
    payment.fees('tester',1).should.equal(config.shop.order.gateway[6].fees);
    payment.fees('bitcoin',1).should.equal(config.shop.order.gateway[7].fees);
    done();
  });   


  it("Check order amount and fees", function(done){
    Orders.findOne({oid:2000007}).select('+payment.transaction').exec(function (e,order) {
      payment.fees(order.payment.issuer,order.getTotalPrice().toFixed(2)).should.equal(0.02*order.getTotalPrice().toFixed(2));
      // console.log(order.payment.issuer, order.getTotalPrice().toFixed(2))
      done();

    })
  })  

  // order state is failure
  it("Voided state can not be changed", function(done){
    var order=data.Orders[0];
    order.payment.status="voided";
    order.fulfillments.status="created";
    payment.for(order.payment.issuer).authorize(order)
      .fail(function(err){
        should.exist(err.message)
        err.message.should.containEql("Impossible d'autoriser une commande")
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
        err.message.should.containEql("Impossible d'autoriser une commande")
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

