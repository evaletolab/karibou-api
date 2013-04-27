// Use a different DB for tests
var app = require("../app/index");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);

var Categories = db.model('Categories');



describe("Categories", function(){
  var _ = require('underscore');
  var assert = require("assert");
  var category=[];


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });  
  
  
  it("Create catalog ", function(done){
    Categories.create({
      name:"Olivier",
      description:"Ebike makers",
      type:"Catalog"
    },function(err,m){
      m.name.should.equal("Olivier");
      m.description.should.equal("Ebike makers");
      m.type.should.equal("Catalog");
      assert(!err)
      done();
    });

  });

  it("Create category with a wrong type", function(done){
    Categories.create({
      name:"Olivier",
      description:"Ebike makers",
      type:"Pouet"
    },function(err,m){
      assert(err);
      err.message.should.equal("Validation failed")
      done();
    });

  });

  it("Create categories from array of strings", function(done){
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

  it("Find inexistant name", function(done){
    Categories.findByName("prfk",function(err,cat){
      assert(!err);
      assert(!cat)
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
    var on=_.map(category,function(v,k){return {name:v.name};});
    Categories.map(on,function(err,cats){
      cats.length.should.equal(3);
      done();
    });      
  });

  it("Maps ObjectId array to category", function(done){
    var oid=_.map(category,function(v,k){return {_id:v._id};});
    Categories.map(oid,function(err,cats){
      cats.length.should.equal(3);
      done();
    });      
  });

  it("Bad element for string array should generate an error", function(done){
    var on=_.map(["FFruits", "Légumes", "Poissons"],function(v,k){return {name:v};});
    Categories.map(on,function(err,cats){
      assert(err);
      done();
    });      
  });

  it("Bad format for string array should generate an error", function(done){
    Categories.map(["Fruits", "Légumes", "Poissons"],function(err,cats){
      //console.log("ERROR",err);
      //console.log("RESULT",cats);
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

