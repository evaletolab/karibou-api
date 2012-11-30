// Use a different DB for tests
var app = require("../app/index");

var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');



describe("Products:", function(){
  var assert = require("assert");
  var user;

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
            done();
          });

        });
      });
      
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

    it.skip("Contact customers directly via twitter", function(done){
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


    beforeEach(function(done){
      done();
    });

    afterEach(function(done){
      done();
    });

    describe("Product is identified by a unique number (SKU Stock-keeping)", function(){

      it("First SKU ", function(done){
        Sequences.nextSku(function(err,sku){
          sku.should.equal(100001);
          done();
        });
      });

      it("Next SKU, ", function(done){
        Sequences.nextSku(function(err,sku){
          sku.should.equal(100002);
          done();
        });
      });

      it("Next SKU, ", function(done){
        Sequences.next('sku',function(err,sku){
          sku.should.equal(100003);
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
    it.skip("Create a new Category", function(done){
    });

    it.skip("Create a new Manufacturer", function(done){
    });

    it("Create a new Shop", function(done){
      var s={
        name: "Votre vélo en ligne",
        description:"cool ce shop",
        bgphoto:"http://image.truc.io/bg-01123.jp",
        fgphoto:"http://image.truc.io/fg-01123.jp"
      
      };
      Shops.create(s,user, function(err,shop){
        assert(!err);
        shop.urlpath.should.equal("votre-velo-en-ligne");
        done();
      });
    });

    it("Find the created Shop", function(done){
      Shops.findOne({urlpath:"votre-velo-en-ligne"},function(err,shop){
          //shop.user.id.should.equal(user.id);
          shop.name.should.equal("Votre vélo en ligne");
          done();
      });
    });

    it("Find the created Shop by the user", function(done){
    
      Shops.findByUser({id:user.id},function(err,shop){
          shop.name.should.equal("Votre vélo en ligne");
          done();
      });
    });

    it("Create a new product", function(done){
      
      Shops.findByUser({id:user.id},function(err,shop){
        assert(shop);
        Products.create(p,shop,function(err,product){
          assert(product.sku);
          assert(product.vendor);
          done();
        });

      });
          
    });
    
    
    it("Find the created product by Shop", function(done){
      Shops.findByUser({id:user.id},function(err,shop){
        assert(shop);
        Products.findByShop(shop,function(err,products){          
          assert(products.length);
          products[0].details.comment.should.equal(p.details.comment);
          done();
        });
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

