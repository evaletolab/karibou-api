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
  , timelimitH=config.shared.order.timelimitH
  , timelimit=config.shared.order.timelimit
  , timeoutAndNotPaid=config.shared.order.timeoutAndNotPaid;





describe("orders.payment", function(){
  var _ = require("underscore");





  before(function(done){
    config.shared.order.gateway[5].fees=0.02
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
    config.shared.order.gateway[5].fees=0
    dbtools.clean(function(){    
      config.shared.order.timelimitH=timelimitH;
      config.shared.order.timelimit=timelimit;
      config.shared.order.timeoutAndNotPaid=timeoutAndNotPaid;
      done();
    });    
  });


  it("Compute issuer fees", function(done){
    // payment.fees('postfinance card',1).should.equal(config.shared.order.gateway[0].fees);
    // payment.fees('postfinance card',(1).toFixed(2)).should.equal(config.shared.order.gateway[0].fees);
    // payment.fees('postfinance card',(36.10).toFixed(2)).toFixed(2).should.equal((config.shared.order.gateway[0].fees*36.10).toFixed(2));
    // payment.fees('postfinance card','1.00').should.equal(config.shared.order.gateway[0].fees);
    payment.fees('american express','10').should.equal(config.shared.order.gateway[1].fees*10);
    payment.fees('visa',1).should.equal(config.shared.order.gateway[2].fees);
    payment.fees('paypal',1).should.equal(config.shared.order.gateway[4].fees);
    payment.fees('invoice',1).should.equal(config.shared.order.gateway[5].fees);
    payment.fees('tester',1).should.equal(config.shared.order.gateway[6].fees);
    payment.fees('bitcoin',1).should.equal(config.shared.order.gateway[7].fees);
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
  it("ERROR Voided state can not be changed", function(done){
    var order=data.Orders[0];
    order.payment.status="voided";
    order.fulfillments.status="created";
    payment.for(order.payment.issuer).authorize(order)
      .fail(function(err){
        should.exist(err.message)
        order.fulfillments.status.should.equal("created");
        order.payment.status.should.equal('voided');
        err.message.should.containEql("Impossible d'autoriser une commande")
        done()        
      })
  });   

  // order state is failure
  it("ERROR Refund state can not be changed", function(done){
    var order=data.Orders[0];
    order.payment.status="refunded";
    order.fulfillments.status="created";
    payment.for(order.payment.issuer).authorize(order)
      .fail(function(err){
        should.exist(err.message)
        order.fulfillments.status.should.equal("created");
        order.payment.status.should.equal('refunded');
        err.message.should.containEql("Impossible d'autoriser une commande")
        done()        
      })
  });   

  it("ERROR Invoice paiement is no more available", function(done){
    var order=data.Orders[1];
    Orders.findOne({oid:data.Orders[1].oid},function (err,order) {
      order.fulfillments.status="reserved";
      payment.for(order.payment.issuer).authorize(order)
        .fail(function(err){
          should.exist(err.message)
          order.fulfillments.status.should.equal("failure");
          order.payment.status.should.equal('voided');
          err.message.should.containEql("Le service de paiement n'est plus disponible")
          done()        
        })
    })
  });   

  it("ERROR Invoice paiement alias is wrong", function(done){
    var order=data.Orders[1];
    Orders.findOne({oid:data.Orders[1].oid},function (err,order) {
      order.payment.status="pending";
      order.fulfillments.status="reserved";
      order.payment.alias='da18ccd1ed10f4774c167ecead9b19aac7f7e65c0df438c3fe5a502706c688800e0e0e';
      payment.for(order.payment.issuer).authorize(order)
        .fail(function(err){
          should.exist(err.message)
          order.fulfillments.status.should.equal("failure");
          order.payment.status.should.equal('voided');
          err.message.should.containEql("La référence de la carte n'est pas compatible avec")
          done()        
        })
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

