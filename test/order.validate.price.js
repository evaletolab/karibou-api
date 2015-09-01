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


describe("orders.validate.price", function(){
  var _ = require("underscore");


  var oneweek=Orders.findOneWeekOfShippingDay();
  var sellerDay=Orders.findCurrentShippingDay();
  var customerDay=oneweek[0];

  //price depends on:
  //-> item fullfilment != failure
  //-> item finalprice
  //-> payment gateway
  //-> shipping

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.price.js"],db,function(err){
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
      done();
    });    
  });

  it("check order price (visa+items+shipping saved with 0) ", function(done){
    db.model('Orders').find({oid:2100000}, function(err,order){
      should.not.exist(err)
      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      order[0].getTotalPrice().should.equal(20.6)
      done();
    });
  });

  it("check order price (+items+shipping) ", function(done){
    db.model('Orders').find({oid:2000006}, function(err,order){
      should.not.exist(err)
      order[0].getTotalPrice().should.equal(30.6)
      done();
    });
  });


  it("check order price (+items(failure)+ full shipping) ", function(done){
    db.model('Orders').find({oid:2000007}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(10);
      order[0].getTotalPrice().should.equal(20.6);
      order[0].getShippingPrice().should.equal(config.shop.shipping.price.hypercenter);
      done();
    });
  });


  it("check order 145fr got special shipping price ", function(done){
    db.model('Orders').find({oid:2000008}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(145);
      order[0].getTotalPrice().should.equal(153);
      order[0].getShippingPrice().should.equal(config.shop.shipping.price.hypercenter-config.shop.shipping.priceA);
      done();
    });
  });

  it("check order 180fr got special shipping price ", function(done){
    db.model('Orders').find({oid:2000009}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(180);
      order[0].getTotalPrice().should.equal(193.8);
      order[0].getShippingPrice().should.equal(10);
      done();
    });
  });

  it("check order shipping half shipping price even with 180CHF", function(done){
    // this way you disabled the discountB
    config.shop.shipping.discountB=0;
    db.model('Orders').find({oid:2000009}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(180);
      order[0].getTotalPrice().should.equal(188.7);
      order[0].getShippingPrice().should.equal(config.shop.shipping.price.hypercenter-config.shop.shipping.priceA);
      config.shop.shipping.discountB=180;
      done();
    });
  });

  it("check order shipping half shipping price when postalCode is 1219 ", function(done){
    db.model('Orders').find({oid:2000010}, function(err,order){
      var discountPeriphery=config.shop.shipping.price.periphery;
      should.not.exist(err)
      order[0].getSubTotal().should.equal(145);
      order[0].getTotalPrice().should.equal(161.05); //3.10=roundCHF((145+17.90-5)*1.02) 
      // 17.90 -5.0
      order[0].getShippingPrice().should.equal(parseFloat((discountPeriphery-config.shop.shipping.priceA).toFixed(2)));
      done();
    });
  });

});

