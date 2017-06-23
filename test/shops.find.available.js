// Use a different DB for tests
// Use a different DB for tests
var app = require("../app");

var db = require("mongoose");
var Shops = db.model('Shops');


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js"]);


describe("shops.find.available", function(){
  var _ = require("underscore"), now=new Date();


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js",'../fixtures/Shops.available.js'],db,function(err){
        should.not.exist(err);
        Shops.find({}).exec(function(err,shops) {
          var str=shops.map(function(s) {
            return s.urlpath;
          }).join(':');
          console.log('-- all',str);        
          // shops.forEach(function(shop,i) {
          //   shop.print()
          // })

        })
        done();
      });
    });      
  });
    
  after(function(done){
    dbtools.clean(function(){
      done();
    });      
  });
    
  it("Today closed-shop is closed ", function(done){
    Shops.findAvailable([now],function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');
        // console.log('------',str)
        str.indexOf('closed-shop').should.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.not.equal(-1);
        done();
    });
  });


  it("Tomorrow closed-shop & shop-not-available-tomorrow are closed ", function(done){
    Shops.findAvailable([now.plusDays(1)],function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');
        // console.log('------',str)
        str.indexOf('closed-shop').should.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.equal(-1);
        done();
    });
  });

  it("Range [Today,Tomorrow] closed-shop is closed & shop-oneday-available is open ", function(done){
    Shops.findAvailable([now,now.tomorrow()],function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');
        // console.log('------',str);
        str.indexOf('closed-shop').should.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.not.equal(-1);
        done();
    });
  });


  it("Range [Tomorrow,Tomorrow+1] closed-shop is closed & shop-oneday-available is open ", function(done){
    Shops.findAvailable([now.plusDays(1),now.plusDays(2)],function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');
        // console.log('------',str);
        str.indexOf('closed-shop').should.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.not.equal(-1);
        done();
    });
  });


  it("Today+7 days closed-shop Shop is closed ", function(done){
    Shops.findAvailable([now.plusDays(7)],function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');
        // console.log('------',str)
        str.indexOf('closed-shop').should.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.not.equal(-1);
        done();
    });
  });

  it("Today+8 days closed-shop and shop-not-available-tomorrow are opens ", function(done){
    Shops.findAvailable([now.plusDays(8)],function(err,shops){
        should.not.exist(err);
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');

        str.indexOf('closed-shop').should.not.equal(-1);
        str.indexOf('shop-not-available-tomorrow').should.not.equal(-1);
        done();
    });
  });



  // only 2 shop available on monday/tuesday (depending if today is sunday!)
  it("Find available Shops for monday/tuesday", function(done){    
    var range=Date.dayToDates([now.getDay()?1:2]);
    Shops.findAvailable(range,function(err,shops){
        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');

        str.indexOf('shop-oneday-available').should.equal(-1);
        shops.length.should.equal(2);
        done();
    });
  });


  // only 3 shop available on monday
  // and one is closed for vacations!
  it("Find available Shops for sunday", function(done){
    var range=Date.dayToDates([0]);
    Shops.findAvailable(range,function(err,shops){
        should.not.exist(err);
        // shops.forEach(function(shop,i) {
        //   shop.print()
        // })

        var str=shops.map(function(s) {
          return s.urlpath;
        }).join(':');

        // console.log('----------------',str,shops.length)
        str.indexOf('shop-oneday-available').should.not.equal(-1);
        shops.length.should.equal(3);
        done();
    });
  });




});

