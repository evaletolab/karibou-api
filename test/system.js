// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories = mongoose.model('Categories');



describe("Backoffice:", function(){
  var async= require("async");
  var assert = require("assert");
  var user;

  var p={
     title: "Pâtes complètes à l'épeautre ''bio reconversion'' 500g",
     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:true, 
     },  
     
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },

     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     },
  
  };


  // common befor/after
  before(function(done){
		Users.findOrCreate({ id: 12345, provider:"twitter", photo:"jpg" }, function (err, u) {
		  assert(u);
		  user=u;
      done();
		});
  
  });

  after(function(done){
      // clean sequences ids
      Shops.remove({}, function(o) {
        Sequences.remove({}, function(o) {
          Products.remove({}, function(o) {
            Categories.remove({}, function(o) {
              done();
            });
          });

        });
      });
      
  });


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

