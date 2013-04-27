var app = require("../app/index");

var db = require("mongoose");


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.js",,"Shops.js"]);
var Users=db.model('Users');


describe("products.find:", function(){
  var async= require("async");
  var _ = require("underscore");
  var Products=db.model('Products');


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.js"],db,function(err){
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


    
  it("Find products by Shop", function(done){
    db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      should.exist(shops[0]);
      Products.findByShop(shops[0],function(err,products){          
        products.length.should.equal(2);        
        products[0].details.comment.should.equal("Temps de cuisson : 16 minutes");
        done();
      });
    });
  });

  it("Find non-BIO products by Shop  ", function(done){

    db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      should.exist(shops);
      Products.findByShop(shops[0]).where("details.isBio",false).exec(function(err,products){          
        products.length.should.equal(1)
        products[0].details.isBio.should.equal(false);
        done();
      });
    });

  });

  it("Find products by string Category  ", function(done){
  
    async.waterfall([
      //
      // find product and  categories
      function(cb){
          Products.find({},function(err,products){          
            db.model('Categories').find({},function(err,cats){
              products.forEach(function(product){
                product.addCategories(cats);
              });
              cb(err,products,cats);
            });
          });
      },
      
      //
      // find product by Cat
      function(products, cats, cb){
        Products.findByCategory("Fruits",function(err,products){
          should.exist(err);
          cb(null,products,cats);
        });
        
      },
      function(products,cats,cb){
        done();
      }
    ],function(err,result){
      should.not.exist(err);
    });

  });
  
  it("Find products by Category  ", function(done){
  
    async.waterfall([
      //
      // find product and  categories
      function(cb){
          Products.find({},function(err,products){          
            db.model('Categories').find({},function(err,cats){
              products.forEach(function(product){
                product.addCategories(cats);
              });
              cb(err,products,cats);
            });

          });

      },
      
      //
      // find product by Cat
      function(products, cats, cb){
        Products.findByCategory(cats[0],function(err,products){
          cb(null,products,cats);
        });
        
      },
      function(products,cats,cb){
        done();
      }
    ],function(err,result){
      should.not.exist(err);
    });

  });
  

  it("Find products by Array Category  ", function(done){
  
    async.waterfall([
      //
      // find product and  categories
      function(cb){
          Products.find({},function(err,products){          
            db.model('Categories').find({},function(err,cats){
              products.forEach(function(product){
                product.addCategories(cats);
              });
              // should be async
              cb(err,products,cats);
            });

          });

      },
      
      //
      // find product by Cat
      function(products, cats, cb){
        Products.findByCategory(cats,function(err,products){
          should.exist(err);
          cb(null,products,cats);
        });
        
      },
      function(products,cats,cb){
        done();
      }
    ],function(err,result){
      should.not.exist(err);
    });

  });

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

