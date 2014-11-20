var app = require("../app");

var db = require("mongoose");


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.more.js","Shops.js"]);
var Users=db.model('Users');


describe("products.find:", function(){
  var async= require("async");
  var _ = require("underscore");
  var Products=db.model('Products');


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.more.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });


  after(function(done){
    dbtools.clean(function(){
      done();
    })
  });

  it("Find products by SKU", function(done){
    Products.findBySkus([1000001,1000002],function(err,products){
      products.length.should.equal(2)  
      products[0].sku.should.equal(1000001)
      products[0].vendor.should.be.instanceOf(Object).and.have.property('name')
//      products[0].vendor.owner.should.be.instanceOf(Object).and.have.property('displayName')
      done();
    });
  });

  it("Find products by SKU", function(done){
    Products.findBySkus([1000001,1000002],function(err,products){
      products.length.should.equal(2)      
      products[0].sku.should.equal(1000001)
      done();
    });
  });

  it("Build query to find products by SKU", function(done){
    Products.findBySkus([1000001,1000002]).exec(function(err,products){
      products.length.should.equal(2)      
      products[0].sku.should.equal(1000001)
      done();
    });
  });

    
  it("Find products by Shop", function(done){
    db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      should.exist(shops[0]);
      Products.findByCriteria({shopname:shops[0].urlpath},function(err,products){          
        products.length.should.equal(2);        
        products[0].details.comment.should.equal("Temps de cuisson : 16 minutes");
        done();
      });
    });
  });

  it("Find Natural products by Shop  ", function(done){

    db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      should.exist(shops[0]);
      Products.findByCriteria({shopname:shops[0].urlpath,details:'natural'},function(err,products){          
        products.length.should.equal(1)
        products[0].details.natural.should.equal(true);
        done();
      });
    });

  });

  it("Find products by Category object  ", function(done){
    Products.find({categories:data.Categories[1]._id},function(err,products){
      should.not.exist(err);
      should.exist(products);
      var ps=[1000001,1000003]
      products.length.should.equal(2)
      ps.should.include(products[0].sku);
      ps.should.include(products[1].sku);
      done();
    });  

  });
  
  it("Find products by slug Category  ", function(done){

    Products.findByCriteria({category:data.Categories[1].slug},function(err,products){
      should.not.exist(err);
      should.exist(products);
      var ps=[1000001,1000003]
      products.length.should.equal(2)
      ps.should.include(products[0].sku);
      ps.should.include(products[1].sku);
      done();
    });  

  });
  

  it.skip("Find products by Array Category  ", function(done){

  

  });

  it("Find products by Category and details(bio=true) ", function(done){
    Products.findByCriteria({category:data.Categories[1].slug,details:'bio'},function(err,products){
      should.not.exist(err);
      should.exist(products);
      products.length.should.equal(1)
      products[0].sku.should.equal(1000003);
      done();
    });  

  });

  it("Find products by Category and details(bio=true, natural=true, homemade=true) ", function(done){
    Products.findByCriteria({category:data.Categories[3].slug,details:'bio+natural+homemade'},function(err,products){
      should.not.exist(err);
      should.exist(products);
      products.length.should.equal(1)
      products[0].sku.should.equal(1000002);
      done();
    });  

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

