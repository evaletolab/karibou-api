// Use a different DB for tests
var app = require("../app/index");

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
    it.skip("Customers read all notifications", function(done){
    });
    
    it.skip("On subscribed vendor, customer is notified of activities", function(done){
    });

    it.skip("On subscribed product, customer is notified of activities [disabled/enabled/deleted]", function(done){
    });  
    
  });
    


});

