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

  it("check order price (visa+items+shipping) ", function(done){
    db.model('Orders').find({oid:2100000}, function(err,order){
      should.not.exist(err)
      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      order[0].getTotalPrice().should.equal(30.85)
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
      order[0].getShippingPrice().should.equal(config.shop.shipping.price);
      done();
    });
  });


  it("check order shipping half shipping price ", function(done){
    db.model('Orders').find({oid:2000008}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(145);
      order[0].getTotalPrice().should.equal(153);
      order[0].getShippingPrice().should.equal(config.shop.shipping.price/2);
      done();
    });
  });

  it("check order shipping free shipping price ", function(done){
    db.model('Orders').find({oid:2000009}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(180);
      order[0].getTotalPrice().should.equal(183.6);
      order[0].getShippingPrice().should.equal(0);
      done();
    });
  });

  it("check order shipping half shipping price even with 180CHF", function(done){
    config.shop.shipping.free=0;
    db.model('Orders').find({oid:2000009}, function(err,order){
      should.not.exist(err)
      order[0].getSubTotal().should.equal(180);
      order[0].getTotalPrice().should.equal(188.7);
      order[0].getShippingPrice().should.equal(config.shop.shipping.price/2);
      config.shop.shipping.free=180;
      done();
    });
  });



});

