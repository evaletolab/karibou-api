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


describe("orders.validate.report.022016", function(){
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
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.report.022016.js"],db,function(err){
        should.not.exist(err);
        // Orders.find({'payment.status':'paid'}).exec(function(e,os){
        //   var oid=os.map(function(o) {
        //     return o.oid
        //   });
        //   os.forEach(function(o){
        //       o.print();            
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
  it("validate report content with the new API 2.0 for Year", function(done){
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByVendor({year:year,grouped:true},function (err,report) {


      report.shops['purogusto'].items.should.equal(48);
      report.shops['purogusto'].amount.should.equal(396);
      report.shops['purogusto'].orders.length.should.equal(20);
      report.shops['purogusto'].fees.should.equal(71.28);
      report.shops['purogusto'].contractFees[0].should.equal(0.18);

      report.shops['les-fromages-de-gaetan'].items.should.equal(83);
      report.shops['les-fromages-de-gaetan'].amount.should.equal(532.45);
      report.shops['les-fromages-de-gaetan'].orders.length.should.equal(29);
      report.shops['les-fromages-de-gaetan'].fees.should.equal(79.87);
      report.shops['les-fromages-de-gaetan'].contractFees[0].should.equal(0.15);

      // report.shops['purogusto'].products.length.should.equal(48);
     report.orders.length.should.equal(39);


      done();
    });
  });






});

