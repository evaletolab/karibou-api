// Use a different DB for tests
var app = require("../app/index");

var fx = require("./fixtures/products");
var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories = mongoose.model('Categories');



describe("Products:", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");
  var user,uid;

  var products, shop, cats;


  // common befor/after
  before(function(done){
    fx.clean(function(e){
      assert(!e);
		  Users.findOrCreate({ id: 12345, provider:"twitter", photo:"jpg" }, function (err, u) {
		    assert(u);
		    user={_id:u._id};
		    uid=u.id;
        done();
		  });
      
    });      

  
  });

  after(function(done){
    fx.clean(function(e){
      assert(!e);
      done();
    });      
  });


    
  describe("Products", function(){

    before(function(done){
      fx.creates(user,function(err, c, s, p){
        p.length.should.equal(2);
        c.length.should.equal(3);
        s.urlpath.should.equal("votre-velo-en-ligne");
        products=p;shop=s;cats=c;
        done();
      });
    });
    
    after(function(done){
      done();
    });


    describe("Product is identified by a unique number (SKU Stock-keeping)", function(){
      var SKU;
      before(function(done){
        Sequences.findOne({name:'sku'},function(err,sku){
          assert(!err);
          SKU=sku.seq;
          done();
        });
      });

      it("First SKU ", function(done){
        Sequences.nextSku(function(err,sku){
          sku.should.equal(SKU+1);
          done();
        });
      });

      it("Next SKU, ", function(done){
        Sequences.nextSku(function(err,sku){
          sku.should.equal(SKU+2);
          done();
        });
      });

      it("Next SKU, ", function(done){
        Sequences.next('sku',function(err,sku){
          sku.should.equal(SKU+3);
          done();
        });
      });

      it("First OTHER shoud equals 100000", function(done){
        Sequences.next('other',function(err,sku){
          sku.should.equal(100000);
          done();
        });
      });
      
    });

    it("Create a new Shop", function(done){
      var s={
        name: "Votre nouveau vélo en ligne ",
        description:"cool ce shop",
        bgphoto:"http://image.truc.io/bg-01123.jp",
        fgphoto:"http://image.truc.io/fg-01123.jp"
      
      };
      Shops.create(s,user, function(err,shop){
        assert(!err);
        shop.urlpath.should.equal("votre-nouveau-velo-en-ligne");
        done();
      });
    });

    it("Find One Shop", function(done){
      Shops.findOne({urlpath:"votre-velo-en-ligne"},function(err,shop){
          //shop.user.id.should.equal(user.id);
          shop.name.should.equal("Votre vélo en ligne");
          done();
      });
    });

    it("Find Shops by the user", function(done){
      Shops.findByUser({id:uid},function(err,shops){
          shops[0].name.should.equal("Votre vélo en ligne");
          shops.length.should.equal(2);
          done();
      });
    });

    it("Create a new product", function(done){
      
      Shops.findByUser({id:uid},function(err,shops){

        assert(shops);
        // basic product creation is on fixture 
        done();

      });
          
    });
    
    
    it("Find products by Shop", function(done){
      Shops.findByUser({id:uid},function(err,shops){
        assert(shops);
        Products.findByShop(shops[0],function(err,products){          
          assert(products.length);
          
          products[0].details.comment.should.equal("Temps de cuisson : 16 minutes");
          done();
        });
      });
    });

    it("Find BIO products by Shop  ", function(done){

      Shops.findByUser({id:uid},function(err,shops){
        assert(shops);
        Products.findByShop(shops[0],function(err,products){          
          assert(products.length);
          products[0].details.isBio.should.equal(false);
          done();
        }).where("details.isBio",false);
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
  
  describe("Likes products", function(){
    it("Customer likes a product ", function(done){
      async.waterfall([
        function(cb){
          Users.findOne({id:uid},function(err,user){
            assert(user);
            cb(err,user);
          });
        },
        function(user,cb){
          Products.findOneBySku(products[0].sku,function(err,product){
            user.addLikes(product,function(err){
              cb(err);
            });
          });
        }
        ,
        function(cb){
          Users.findOne({id:uid}).populate("likes").exec(function(err,user){
            assert(user.likes);
            //console.log(user);
            cb(null,user);
          });
        }]
        ,    
        function(err,user){
          assert(!err);
          //FIXME once likes was NULL ??? check this if it repeats
          user.likes[0].title.should.equal(products[0].title);
          done();
        });
    });

    it("Customer unlikes a product ", function(done){
      Users.findOne({id:uid},function(err,user){
          assert(user);
          Products.findOneBySku(products[0].sku,function(err,product){
            user.removeLikes(product, function(err){
              assert(!err)
              Users.findOne({id:uid}).populate("likes").exec(function(err,user){
                assert(user.likes.length===0);
                done();
              });

            });
          });
      });
    });

    it("On removed product, user likes should be updated", function(done){
      async.waterfall([
        function(cb){
          Users.findOne({id:uid},function(err,user){
            assert(user);
            cb(err,user);
          });
        },
        function(user,cb){
          Products.findOneBySku(products[0].sku,function(err,product){
            user.addLikes(product,function(err){
              cb(err,user, product);
            });
          });
        }
        ,
        function(user, product,cb){
            Products.remove({},function(err){
              cb(err,user,product);
            });
        },
        function(user,product,cb){
            Users.findOne({id:uid}).populate("likes").exec(function(err,user){
              assert(user.likes.length===0);
              done();
            });
        }
      ],function(err,result){
        assert(!err);
      });

    });

  });


});

