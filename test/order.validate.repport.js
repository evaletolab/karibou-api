// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");

var Products=db.model('Products')
  , Orders=db.model('Orders')
  , criteria={}
  , today=new Date()
  , toshortDay
  , okDay;


describe("orders.validate.repport", function(){
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
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.repport.js"],db,function(err){
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

  it("validate repport content ", function(done){

    //
    // order 2000006 contains variation on
    // -> item 1000002 [un-autre-shop] + 1.-

    Orders.generateRepportForShop(criteria,function(err,repport){
      should.not.exist(err)
      // Object.keys(repport.shops).forEach(function (slug) {
      //   console.log('-----',slug,repport.shops[slug])
      // })


      repport.shops['mon-shop'].monthitems.should.equal(2);
      repport.shops['mon-shop'].monthamount.should.equal(5);
      repport.shops['mon-shop'].monthorders.should.equal(2);

      // fees are changing for mon-shop
      //-------- mon-shop 2.5 0.15 0.375
      //last day mon-shop 2.5 0.3 0.75
      repport.shops['mon-shop'].monthfees.should.equal(1.13);
      repport.shops['mon-shop'].details.fees.should.equal(0.3);

      repport.shops['super-shop'].monthitems.should.equal(3);
      repport.shops['super-shop'].monthamount.should.equal(10);
      repport.shops['super-shop'].monthorders.should.equal(1);
      repport.shops['super-shop'].monthfees.should.equal(1.6);
      repport.shops['super-shop'].details.fees.should.equal(0.16);

      repport.shops['un-autre-shop'].monthitems.should.equal(17);
      repport.shops['un-autre-shop'].monthamount.should.equal(55.6);
      repport.shops['un-autre-shop'].monthorders.should.equal(4);
      repport.shops['un-autre-shop'].monthfees.should.equal(7.78);
      repport.shops['un-autre-shop'].details.fees.should.equal(0.14);
      repport.monthamount.should.equal(70.6);
      // fees are changing for mon-shop
      //-------- mon-shop total was 9.99 + 0.375
      repport.monthca.should.equal(10.51);
      repport.monthitems.should.equal(22);
      repport.monthorders.should.equal(4);



      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      done();
    });
  });


  it("validate repport content with the new API", function(done){

    //
    // order 2000006 contains variation on
    // -> item 1000002 [un-autre-shop] + 1.-
    var month=criteria.from.getMonth()+1, year=criteria.from.getFullYear();
    Orders.getCAByYearMonthAndVendor({month:month},function (err,repport) {
      should.not.exist(err)


      repport[year][month]['mon-shop'].items.should.equal(2);
      repport[year][month]['mon-shop'].amount.should.equal(5);
      repport[year][month]['mon-shop'].orders.should.equal(2);
      repport[year][month]['mon-shop'].fees.should.equal(1.13);
      // FIXME select vendor fees 
      repport[year][month]['mon-shop'].details.fees.should.equal(0.15);

      repport[year][month]['super-shop'].items.should.equal(3);
      repport[year][month]['super-shop'].amount.should.equal(10);
      repport[year][month]['super-shop'].orders.should.equal(1);
      repport[year][month]['super-shop'].fees.should.equal(1.6);
      repport[year][month]['super-shop'].details.fees.should.equal(0.16);

      repport[year][month]['un-autre-shop'].items.should.equal(17);
      repport[year][month]['un-autre-shop'].amount.should.equal(55.6);
      repport[year][month]['un-autre-shop'].orders.should.equal(4);
      repport[year][month]['un-autre-shop'].fees.should.equal(7.78);
      repport[year][month]['un-autre-shop'].details.fees.should.equal(0.14);

      repport[year][month].fees.should.equal(10.51);
      repport[year][month].items.should.equal(22);
      repport[year][month].orders.should.equal(4);

      done();
    })

  });



  it("validate repport content for unknown year ", function(done){
    setCriteriaDateByMonthAndYear(criteria,sellerDay.getMonth(),1989)

    Orders.generateRepportForShop(criteria,function(err,repport){
      should.not.exist(err)

      repport.monthamount.should.equal(0);
      repport.monthca.should.equal(0);
      repport.monthitems.should.equal(0);
      repport.monthorders.should.equal(0);


      // item!='failure' => E(item.price) + gateway fees + shipping fees
      // this order contains only shipping
      done();
    });
  });





});

