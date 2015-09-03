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
  var priceB=config.shop.shipping.priceB;


  //price depends on:
  //-> item fullfilment != failure
  //-> item finalprice
  //-> payment gateway
  //-> shipping

  before(function(done){
    dbtools.clean(function(e){
      data.Users[1].merchant=true;
      data.Users[2].merchant=true;
      config.shop.shipping.priceB=6;
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.price.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      data.Users[1].merchant=false;
      data.Users[2].merchant=false;
      config.shop.shipping.priceB=priceB;
      done();
    });    
  });

  it("check order price (visa+items+shipping) ", function(done){
    db.model('Orders').find({oid:2100000}, function(err,order){
      should.not.exist(err)
      //
      // remove saved shipping price
      // item!='failure' => E(item.price) + gateway fees + shipping fees
      order[0].getTotalPrice().should.equal(20.6)
      order[0].payment.fees.shipping=undefined;
      order[0].getTotalPrice().should.equal(24.7)
      done();
    });
  });

  it("check order price (+items+shipping) ", function(done){
    db.model('Orders').find({oid:2000006}, function(err,order){
      should.not.exist(err)
      order[0].getTotalPrice().should.equal(24.5)
      done();
    });
  });

  it("check order 145fr, got merchant shipping price ", function(done){
    db.model('Orders').find({oid:2000008}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(145);
      order[0].getTotalPrice().should.equal(152); //(145+4) *1.02
      order[0].getShippingPrice().should.equal(4);
      done();
    });
  });

  it("check order 180fr, got merchant shipping price ", function(done){
    db.model('Orders').find({oid:2000009}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(180);
      order[0].getTotalPrice().should.equal(187.7);//(180+4) *1.02
      order[0].getShippingPrice().should.equal(4);
      done();
    });
  });


  it("check order 145fr and postalCode is 1219, got merchant price ", function(done){
    db.model('Orders').find({oid:2000010}, function(err,order){
      var discountPeriphery=config.shop.shipping.price.periphery;
      should.not.exist(err)
      order[0].getSubTotal().should.equal(145);
      order[0].getTotalPrice().should.equal(160.05); //3.10=roundCHF((145+17.90-6)*1.02) 
      // 17.90 -5.0
      order[0].getShippingPrice().should.equal(11.90);
      done();
    });
  });

});

