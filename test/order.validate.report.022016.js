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
  //  - Pain naturellement sans gluten, 42.00, 7, total:42.00 (1000313 7x vs 5x)
  //  - Gâteau à l’orange, 28.00, 7, total:70.00
  //  - Quiche salée, 30.00, 5, total:100.00
  //  - Lasagne, 55.00, 5, total:155.00
  //  - Muffin salé (naturellement sans gluten), 25.00, 5, total:180.00
  //  - Pizza de farine mi-blanche aux légumes grillés, 48.00, 4, total:228.00
  //  - Parmigiana d’aubergines, 44.00, 4, total:272.00
  //  - Petit caprèse  au chocolat noir, 18.00, 3, total:290.00 (1000306 3x vs 5x)
  //  - Tiramisu, 20.00, 2, total:310.00
  //  - Pâtes d'épeautre BIO avec sauce noix, 36.00, 2, total:346.00
  //  - Pizza Margherita de farine mi-blanche, 10.00, 1, total:356.00
  //  - Pain d’épices aux trois poivres, 12.00, 1, total:368.00
  //  - Pate à tartiner chocolat noir/noisette, 15.00, 1, total:383.00
  //  - Pâtes de blé BIO avec sauce tomate, 13.00, 1, total:396.00
  
  it("validate report content with the new API 2.0 for Year", function(done){
    var month=criteria.from.getMonth()+1, year=2016;
    Orders.getCAByVendor({year:year,grouped:true},function (err,report) {


      // check quantity of products 
      var sku1000313=report.products.filter(function(p){
        return p.sku===1000313;
      });
      sku1000313[0].count.should.equal(7);
      sku1000313[0].amount.should.equal(42);
      sku1000313[0].vendor.should.equal('purogusto');
      sku1000313.length.should.equal(1);
            

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

