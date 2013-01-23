// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories = mongoose.model('Categories');



describe("Categories", function(){
  var async= require("async");
  var assert = require("assert");
  var category=[];
  describe("Categories", function(){
    before(function(done){
      Categories.remove({}, function(o) {
        done();
      });
      
    });
    
    
    it("Create a new Manufacturer", function(done){
      Categories.create({
        name:"Olivier",
        description:"Ebike makers",
        type:"Manufacturer"
      },function(err,m){
        m.name.should.equal("Olivier");
        m.type.should.equal("Manufacturer");
        m.description.should.equal("Ebike makers");
        done();
      });

    });

    it("Create category with a wrong type", function(done){
      Categories.create({
        name:"Olivier",
        description:"Ebike makers",
        type:"True"
      },function(err,m){
        assert(err);
        err.errors.type.message.should.be.a.string;
        done();
      });

    });

    it("Add categories structure", function(done){
      Categories.create(["Fruits", "Légumes", "Poissons"],function(err,cats){
        assert(!err)
        cats.length.should.equal(3);
        category=cats;  
        done();
      });
    });

    it("Find by name", function(done){
      Categories.findByName("Fruits",function(err,cat){
        assert(!err);
        cat.name.should.equal("Fruits");
        done();
      });
    });

    it("Add duplicate categories structure", function(done){
      Categories.create("Fruits",function(err,cat){
        assert(err);
        done();
      });
    });

    it("Maps string array to category", function(done){
      Categories.map("name",["Fruits", "Légumes", "Poissons"],function(err,cats){
        cats.length.should.equal(3);
        done();
      });      
    });

    it("Maps ObjectId array to category", function(done){
      var oid=require('underscore').map(category,function(v,k){return v._id;});
      Categories.map("_id",oid,function(err,cats){
        cats.length.should.equal(3);
        done();
      });      
    });

    it("Maps WRONG string array shoudl generate an error", function(done){
      Categories.map("name",["FFruits", "Légumes", "Poissons"],function(err,cats){
        assert(err);
        done();
      });      
    });

    it.skip("Products-to-categories structure", function(done){
    });
    
    it.skip("Categories-to-categories structure", function(done){
    });
    
    it.skip("Add/Edit/Remove categories, products, manufacturers, customers, and reviews", function(done){
    });

  });




});

