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
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.report.discount.js"],db,function(err){
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

  //
  //
  it("report content include discount even for not fulfilled items ", function(done){
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByVendor({year:year,grouped:true},function (err,report) {
      // report.forEach(function(report) {
      //   console.log('------',report._id.vendor,report.items,report.amount,report.fees,report.orders)
      // })
      // console.log(JSON.stringify(results,0,2));
      // console.log('---------',report.shops['mon-shop'])
      // console.log('---------',report.shops['super-shop'])
      // console.log('---------ca  ',report.shops['un-autre-shop'].amount)
      // console.log('---------fees',report.shops['un-autre-shop'].fees)
      // console.log('---------disc',report.shops['un-autre-shop'].discount)
      //
      // not fulfilled should keep discount!
      report.shops['mon-shop'].discount.should.equal(0.5);
      report.shops['super-shop'].discount.should.equal(0);
      report.shops['un-autre-shop'].discount.should.equal(1.5);

      //
      // validate fees after discount reduction
      var fees=(report.shops['un-autre-shop'].amount-report.shops['un-autre-shop'].discount)*report.shops['un-autre-shop'].contractFees[0];
      report.shops['un-autre-shop'].
        fees.should.equal(parseFloat(fees.toFixed(2)))

      done();
    });
  });





});

