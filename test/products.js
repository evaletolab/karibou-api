// Use a different DB for tests
// Use a different DB for tests
var app = require("../app/index");

var fx = require("./fixtures/products");
var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories = mongoose.model('Categories');



describe("Products", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");
  var user,uid;



 

  it.skip("Find products by Manufacturer and Category and details ", function(done){
  });

  it.skip("Product can be enabled or disabled", function(done){
  });

  it.skip("Product could have a related products", function(done){
  });

  it.skip("Product could have variations", function(done){
  });

  it.skip("Control if out of stock products can still be shown and are available for purchase", function(done){
  });

  

});

