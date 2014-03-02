// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("system", function(){

  describe("Administration", function(){
  
    it.skip("Contact customers directly via email or newsletters", function(done){
    });

    it.skip("Contact customers directly via twitter", function(done){
    });
    
    it.skip("Easily backup and restore", function(done){
    });

    it.skip("Print invoices and packaging lists from the order screen", function(done){
    });

    it.skip("Statistics for products and customers", function(done){
    });
    
    it.skip("Requets the shop creation", function(done){
    });

    it.skip("New shop is accepted", function(done){
    });

    it.skip("New shop is denied", function(done){
    });
    
  });
  
 
  describe("System notifications", function(){
    it("Basic testing of the Bus", function(done){
        var bus=require('../app/bus'), em=0;
        bus.on('test',function(a,cb){
            cb(a+'-1')
        })
        bus.on('test',function(a,cb){
            cb(a+'-2')
        })

        //
        // this emiter will receive multiple callback 
        // and this is an issue because only one done is permitted
        bus.emit('test','msg',function(out){

            //console.log(out,bus.listeners('test').length)            
            if(++em===2)done()
        })
    });

    it.skip("Customers read all notifications", function(done){
    });
    
    it.skip("On subscribed vendor, customer is notified of activities", function(done){
    });

    it.skip("On subscribed product, customer is notified of activities [disabled/enabled/deleted]", function(done){
    });  
    
  });
    


});

