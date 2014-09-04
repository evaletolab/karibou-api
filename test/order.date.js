// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var should = require("should");
var Orders=db.model('Orders');

describe("orders.date", function(){
  var _ = require("underscore"),
      now=Date.now();

  before(function(done){
    //Orders.printInfo()
    console.log("today it's ",moment(now).format('DDD'))
    done()
  });

  
  after(function(done){
    done()
  });

  


  it("[SELLER] with a time limit at 23:00PM the current shipping day for seller is today (except for sunday)", function(done){
    //if today time is > config.shop.order.timelimitH ==> go to next day
    config.shop.order.timelimitH=23
    var today=new Date(), nextSeller=Orders.findCurrentShippingDay()

    //
    // sunday is off 
    if (today.getDay()==0){
      nextSeller.getDay().should.equal((today.getDay()+1))      
    }else{
      today.getDay().should.equal(nextSeller.getDay())      
    }

    done()    
  });

  it("[SELLER] with a time limit at 1:00AM the current shipping day for seller is today+1 (except for saturday+2)", function(done){
    //if today time is > config.shop.order.timelimitH ==> go to next day
    config.shop.order.timelimitH=1
    var today=new Date(), nextSeller=Orders.findCurrentShippingDay()

    //
    // sunday is off 
    if (today.getDay()==6){
      nextSeller.getDay().should.equal((today.getDay()+2)%7)      
    }else{
      nextSeller.getDay().should.equal(today.getDay()+1)      
    }

    done()    
  });


  it("[CUSTOMER] with a preparation time limit of 24H before 23:00 the current shipping day is today+1 (except for saturday+2)", function(done){
    config.shop.order.timelimit=24
    config.shop.order.timelimitH=23
    var today=new Date(), nextSeller=Orders.findNextShippingDay()

    //
    // sunday is off 
    if (today.getDay()==6){
      nextSeller.getDay().should.equal((today.getDay()+2)%7)      
    }else{
      nextSeller.getDay().should.equal(today.getDay()+1)      
    }

    done();          
  });


  it("[CUSTOMER] with a preparation time limit of 24H before 1:00 the current shipping day is today+2 (except for friday+3)", function(done){
    config.shop.order.timelimit=24
    config.shop.order.timelimitH=1
    var today=new Date(), nextSeller=Orders.findNextShippingDay()

    //
    // sunday is off 
    if (today.getDay()==5){
      nextSeller.getDay().should.equal((today.getDay()+3)%7)      
    }else{
      nextSeller.getDay().should.equal((today.getDay()+2)%7)      
    }

    done();          
  });  

  it("[CUSTOMER] with a preparation time limit of 48H before 23:00 the current shipping day is today+2 (except for friday+3)", function(done){
    config.shop.order.timelimit=48
    config.shop.order.timelimitH=23
    var today=new Date(), nextSeller=Orders.findNextShippingDay()

    //
    // sunday is off 
    if (today.getDay()==5){
      nextSeller.getDay().should.equal((today.getDay()+3)%7)      
    }else{
      nextSeller.getDay().should.equal((today.getDay()+2)%7)      
    }

    done();          
  });


  it("[CUSTOMER] with a preparation time limit of 48H before 1:00 the current shipping day is today+3 (except for wednesday+4)", function(done){
    config.shop.order.timelimit=48
    config.shop.order.timelimitH=1
    var today=new Date(), nextSeller=Orders.findNextShippingDay()

    //
    // sunday is off 
    if (today.getDay()==4){
      nextSeller.getDay().should.equal((today.getDay()+4)%7)      
    }else{
      nextSeller.getDay().should.equal((today.getDay()+3)%7)      
    }

    done();          
  });

  it("[CUSTOMER] with a preparation time limit of 49H before 1:00 the current shipping day is today+4 (except for tuesday+5)", function(done){
    config.shop.order.timelimit=49
    config.shop.order.timelimitH=1
    var today=new Date(), nextSeller=Orders.findNextShippingDay()

    //
    // sunday is off 
    if (today.getDay()==3){
      nextSeller.getDay().should.equal((today.getDay()+5)%7)      
    }else{
      nextSeller.getDay().should.equal((today.getDay()+4)%7)      
    }

    done();          
  });
});
