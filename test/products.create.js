// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);

var Products=db.model('Products');

describe("products.create", function(){
  var _ = require("underscore");

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js"],db,function(err){
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

    
  describe("Product is identified by a unique number (SKU Stock-keeping)", function(){
    var SKU;
    before(function(done){
      db.model('Sequences').findOne({name:'sku'},function(err,sku){
        should.not.exist(err);
        SKU=sku.seq;
        done();
      });
    });

    it("First SKU ", function(done){
      db.model('Sequences').nextSku(function(err,sku){
        sku.should.equal(SKU+1);
        done();
      });
    });

    it("Next SKU, ", function(done){
      db.model('Sequences').nextSku(function(err,sku){
        sku.should.equal(SKU+2);
        done();
      });
    });

    it("Next SKU, ", function(done){
      db.model('Sequences').next('sku',function(err,sku){
        sku.should.equal(SKU+3);
        done();
      });
    });

    it("First OTHER shoud equals 100000", function(done){
      db.model('Sequences').next('other',function(err,sku){
        sku.should.equal(1000000);
        done();
      });
    });
    
  });


  it.skip("Error on creation of a new product with wrong category type", function(done){
    var p=_.clone(data.Products[0]);
    p.title="test wrong product"
    delete(p.sku);
    delete(p._id);
    p.categories=data.Categories[2]._id;
    Products.create(p,data.Shops[0],function(err,product){
      err.should.equal("cannot associate product and catalog");
      done();          
    });
  });


  it("Error on creation of a empty {} product", function(done){
    Products.create({},data.Shops[0],function(err,product){
      should.exist(err)
      done();          
    });
  });


  it("Error on creation of a new product without category", function(done){
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.categories=null;
    Products.create(p,data.Shops[0],function(err,product){
      //console.log(err)
      err.should.equal("Il manque la catégorie");
      done();          
    });
  });

  it("Error on creation of a new product with an array of categories", function(done){
    var p=_.clone(data.Products[0]);
    delete(p._id);
    p.categories=[data.Categories[2]];
    Products.create(p,data.Shops[0],function(err,product){
      //console.log(err)
      err.should.equal("la catégorie doit être unique");
      done();          
    });
  });

  it("Create a new product X", function(done){

    //
    // set the manfacturer
    //p.manufacturer=maker;
    var p=_.clone(data.Products[1]);
    delete(p._id);
    p.categories=data.Categories[2];
    Products.create(p,data.Shops[0],function(err,product){
      should.not.exist(err);
      should.exist(product);
      done();          
    });
    

  });

  it("Create a new product Y", function(done){

    //
    // set the manfacturer
    //p.manufacturer=maker;
    var p=_.clone(data.Products[1]);
    p.categories=data.Categories[2];
    Products.create(p,data.Shops[0],function(err,product){
      should.not.exist(err);
      should.exist(product);
      done();          
    });
        
  });

});

