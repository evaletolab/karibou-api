// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Products = mongoose.model('Products');



describe("Products:", function(){
  var assert = require("assert");

  beforeEach(function(done){
  });

  afterEach(function(done){
  });

  describe("Categories", function(){

    it.skip("Products-to-categories structure", function(done){
    });
    
    it.skip("Categories-to-categories structure", function(done){
    });
    
    it.skip("Add/Edit/Remove categories, products, manufacturers, customers, and reviews", function(done){
    });

  });
  describe("Administration", function(){
  
    it.skip("Contact customers directly via email or newsletters", function(done){
    });
    
    it.skip("Easily backup and restore", function(done){
    });

    it.skip("Print invoices and packaging lists from the order screen", function(done){
    });

    it.skip("Statistics for products and customers", function(done){
    });
  });
  
  describe("Customers", function(){
    it.skip("Customers can view their order history and order statuses", function(done){
    });

    it.skip("Customers can maintain their multiple shipping and billing addresses", function(done){
    });

    it.skip("Temporary shopping cart for guests and permanent shopping cart for customers", function(done){
    });

    it.skip("Fast and friendly quick search and advanced search features", function(done){
    });

    it.skip("Product reviews for an interactive shopping experience", function(done){
    });

    it.skip("Secure transactions with SSL", function(done){
    });

    it.skip("Number of products in each category can be shown or hidden", function(done){
    });

    it.skip("Global and per-category bestseller lists", function(done){
    });

    it.skip("Display what other customers have ordered with the current product shown", function(done){
    });

    it.skip("Breadcrumb trail for easy site navigation", function(done){
    });
  });
  
  describe("Products", function(){
    it.skip("Control if out of stock products can still be shown and are available for purchase", function(done){
    });

    it.skip("Customers can subscribe to products to receive related emails/newsletters", function(done){
    });
  });
  
  describe("Likes products", function(){
    it.skip("Customer likes/unlikes a product ", function(done){
    });

    it.skip("On removed product, customer should be notified", function(done){
    });

  
  });


});

