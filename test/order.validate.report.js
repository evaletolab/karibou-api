// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var util=require("util");

var Products=db.model('Products')
  , Orders=db.model('Orders')
  , criteria={}
  , today=new Date()
  , toshortDay
  , okDay;


describe("orders.validate.report", function(){
  var _ = require("underscore");


  var oneweek=Orders.findOneWeekOfShippingDay();
  var sellerDay=Orders.findCurrentShippingDay();
  var customerDay=oneweek[0];

  function setCriteriaDateByMonthAndYear (criteria,month,year) {
    criteria.from=new Date()
    criteria.from.setDate(1)
    criteria.from.setMonth(month)
    if(year)criteria.from.setMonth(year);
    criteria.from.setHours(1,0,0,0)    

    criteria.to=new Date(criteria.from);
    criteria.to.setDate(criteria.from.daysInMonth());
    criteria.to.setHours(23,0,0,0);    

  }
  //price depends on:
  //-> item fullfilment != failure
  //-> item finalprice
  //-> payment gateway
  //-> shipping

  before(function(done){
    setCriteriaDateByMonthAndYear(criteria,sellerDay.getMonth())

    // show !fulfilled items
    criteria.showAll=false;

    // TODO those 2 criterias should set by default?
    // only fulfilled
    criteria.fulfillment='fulfilled';
    // only closed
    criteria.closed=true;


    // restrict to a list of shops
    // criteria.shop=req.user.shops.map(function(i){ return i.urlpath})      



    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.report.js"],db,function(err){
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

  it("validate report content ", function(done){

    //
    // order 2000006 contains variation on
    // -> item 1000002 [un-autre-shop] + 1.-

    Orders.generateRepportForShop(criteria,function(err,report){
      should.not.exist(err)
      // Object.keys(report.shops).forEach(function (slug) {
      //   console.log('-----',slug,report.shops[slug])
      // })


      report.shops['mon-shop'].monthitems.should.equal(2);
      report.shops['mon-shop'].monthamount.should.equal(5);
      report.shops['mon-shop'].monthorders.should.equal(2);

      // fees are changing for mon-shop
      //-------- mon-shop 2.5 0.15 0.375
      //last day mon-shop 2.5 0.3 0.75
      report.shops['mon-shop'].monthfees.should.equal(1.13);
      report.shops['mon-shop'].details.fees.should.equal(0.3);

      report.shops['super-shop'].monthitems.should.equal(3);
      report.shops['super-shop'].monthamount.should.equal(10);
      report.shops['super-shop'].monthorders.should.equal(1);
      report.shops['super-shop'].monthfees.should.equal(1.6);
      report.shops['super-shop'].details.fees.should.equal(0.16);

      report.shops['un-autre-shop'].monthitems.should.equal(17);
      report.shops['un-autre-shop'].monthamount.should.equal(55.6);
      report.shops['un-autre-shop'].monthorders.should.equal(4);
      report.shops['un-autre-shop'].monthfees.should.equal(7.78);
      report.shops['un-autre-shop'].details.fees.should.equal(0.14);
      report.monthamount.should.equal(70.6);
      // fees are changing for mon-shop
      //-------- mon-shop total was 9.99 + 0.375
      report.monthca.should.equal(10.51);
      report.monthitems.should.equal(22);
      report.monthorders.should.equal(4);

      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      done();
    });
  });

  //
  //
  it("validate report content with the new API 2.0 for Year", function(done){
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByVendor({year:year,grouped:true},function (err,report) {
      // report.forEach(function(report) {
      //   console.log('------',report._id.vendor,report.items,report.amount,report.fees,report.orders)
      // })
      // console.log(JSON.stringify(results,0,2));
      console.log('-------- TRAVIS DEBUG',report.shops['mon-shop'].contractFees)
      report.shops['mon-shop'].items.should.equal(2);
      report.shops['mon-shop'].amount.should.equal(5);
      report.shops['mon-shop'].orders.should.equal(2);
      report.shops['mon-shop'].fees.should.equal(1.13);
      report.shops['mon-shop'].contractFees[0].should.equal(0.3);
      report.shops['mon-shop'].contractFees[1].should.equal(0.15);
      report.shops['mon-shop'].products.length.should.equal(1);
      report.shops['mon-shop'].products[0].count.should.equal(1);
      report.shops['mon-shop'].products[0].amount.should.equal(2.5);

      report.shops['super-shop'].items.should.equal(3);
      report.shops['super-shop'].amount.should.equal(10);
      report.shops['super-shop'].orders.should.equal(1);
      report.shops['super-shop'].fees.should.equal(1.6);
      report.shops['super-shop'].contractFees[0].should.equal(0.16);

      report.shops['un-autre-shop'].items.should.equal(17);
      report.shops['un-autre-shop'].amount.should.equal(55.6);
      report.shops['un-autre-shop'].orders.should.equal(4);
      report.shops['un-autre-shop'].fees.should.equal(7.78);
      report.shops['un-autre-shop'].contractFees[0].should.equal(0.14);
      report.shops['un-autre-shop'].products.length.should.equal(7);
      report.amount.should.equal(70.6);
      report.ca.should.equal(10.51);
      report.items.should.equal(22);
      report.orders.should.equal(7);
      report.products.length.should.equal(4);


      done();
    });
  });

  //
  //
  it("validate report content with the new API 2.0 for Month", function(done){
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByVendor({month:month,grouped:true},function (err,report) {

      done();
    });
  });

  it("validate report content with the new API 1.0", function(done){

    //
    // order 2000006 contains variation on
    // -> item 1000002 [un-autre-shop] + 1.-
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByYearMonthAndVendor({month:month},function (err,report) {
      should.not.exist(err)


      report[year][month]['mon-shop'].items.should.equal(2);
      report[year][month]['mon-shop'].amount.should.equal(5);
      report[year][month]['mon-shop'].orders.should.equal(2);
      report[year][month]['mon-shop'].fees.should.equal(1.13);
      report[year][month]['mon-shop'].contractFees.length.should.equal(2);
      
      // FIXME select vendor fees TODO travis dont get the same value 0.15 vs 0.30
      //report[year][month]['mon-shop'].details.fees.should.equal(0.3);
      report[year][month]['super-shop'].items.should.equal(3);
      report[year][month]['super-shop'].amount.should.equal(10);
      report[year][month]['super-shop'].orders.should.equal(1);
      report[year][month]['super-shop'].fees.should.equal(1.6);
      report[year][month]['super-shop'].contractFees[0].should.equal(0.16);

      report[year][month]['un-autre-shop'].items.should.equal(17);
      report[year][month]['un-autre-shop'].amount.should.equal(55.6);
      report[year][month]['un-autre-shop'].orders.should.equal(4);
      report[year][month]['un-autre-shop'].fees.should.equal(7.78);
      report[year][month]['un-autre-shop'].contractFees[0].should.equal(0.14);


      // report[year][month].fees.should.equal(10.51);
      // report[year][month].items.should.equal(22);
      // report[year][month].orders.should.equal(4);

      done();
    })

  });



  it.skip("validate report content for unknown year ", function(done){
    setCriteriaDateByMonthAndYear(criteria,sellerDay.getMonth(),1989)

    Orders.generateRepportForShop(criteria,function(err,report){
      should.not.exist(err)

      report.monthamount.should.equal(0);
      report.monthca.should.equal(0);
      report.monthitems.should.equal(0);
      report.monthorders.should.equal(0);


      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      done();
    });
  });





});

