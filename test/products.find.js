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



describe("products.find:", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");

  var products, shop, cats, maker;


  // common befor/after
  before(function(done){
    fx.create_all(function(err,s,c,m,p){
      assert(!err);
      shop=s;cats=c;maker=m;products=p;
      done()
    })
  
  });

  after(function(done){
    fx.clean(function(){
      done();
    })
  });


    
  it("Find products by Shop", function(done){
    Shops.findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      assert(shops);
      Products.findByShop(shops[0],function(err,products){          
        assert(products.length);
        
        products[0].details.comment.should.equal("Temps de cuisson : 16 minutes");
        done();
      });
    });
  });

  it("Find non-BIO products by Shop  ", function(done){

    Shops.findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
      assert(shops);
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
            Categories.find({},function(err,cats){
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
          assert(err);
          cb(null,products,cats);
        });
        
      },
      function(products,cats,cb){
        done();
      }
    ],function(err,result){
      assert(!err);
    });

  });
  
  it("Find products by Category  ", function(done){
  
    async.waterfall([
      //
      // find product and  categories
      function(cb){
          Products.find({},function(err,products){          
            Categories.find({},function(err,cats){
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
      assert(!err);
    });

  });
  

  it("Find products by Array Category  ", function(done){
  
    async.waterfall([
      //
      // find product and  categories
      function(cb){
          Products.find({},function(err,products){          
            Categories.find({},function(err,cats){
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
          assert(err);
          cb(null,products,cats);
        });
        
      },
      function(products,cats,cb){
        done();
      }
    ],function(err,result){
      assert(!err);
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

