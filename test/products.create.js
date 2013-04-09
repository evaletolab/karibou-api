// Use a different DB for tests
var app = require("../app/index");

var fx = require("./fixtures/products");
var mongoose = require("mongoose");
var Products = mongoose.model('Products');
var Shops = mongoose.model('Shops');
var Users = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories = mongoose.model('Categories');



describe("products.create:", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");
  var user,uid;

  var maker, shop, cats;


  // common befor/after
  before(function(done){
    fx.clean(function(e){
      assert(!e);
		  Users.findOrCreate({ id: 12345, provider:"twitter", photo:"jpg" }, function (err, u) {
		    assert(u);
		    user={_id:u._id};
		    uid=u.id;
        fx.create_base(user,function(err, c, s, m){
          shop = s;
          cats = c;
          maker= m;
          done();  
        });
        
		  });
      
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


  it("Error on creation of a new product without manufacturer", function(done){
    
    var p={
       title: "Test product 1",
       
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


    Shops.findByUser({id:uid},function(err,shops){
      assert(shops);
      Products.create(p,shops[0],function(err,product){
        err.should.equal("manufacturer is missing");
        done();          
      });

    });
        
  });


  it("Error on creation of a new product without category", function(done){
    
    var p={
       title: "Test product 1",
       
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


    //
    // set the manfacturer
    p.manufacturer=maker;
    Shops.findByUser({id:uid},function(err,shops){
      assert(shops);
      Products.create(p,shops[0],function(err,product){
        err.should.equal("category is missing");
        done();          
      });

    });
        
  });



  it("Create a new product X", function(done){
    
    var p={
       title: "Test product 1",
       
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

    //
    // set the manfacturer
    p.manufacturer=maker;
    p.categories=[cats[0]];
    Shops.findByUser({id:uid},function(err,shops){
      assert(shops);
      Products.create(p,shops[0],function(err,product){
        done();          
      });
    });

  });


  it("Create a new product Y", function(done){
    
    var p={
       title: "Test product 2",
       
       details:{
          description:"Gragnano de sa colline qui n'est pas BIO :-/",
          comment:"Temps de cuisson : 15 minutes",
          hasGluten:true, 
          hasOgm:false,
          isBio:false, 
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

    //
    // set the manfacturer
    p.manufacturer=maker;
    p.categories=[cats[1]];;
    Shops.findByUser({id:uid},function(err,shops){
      assert(shops);
      Products.create(p,shops[0],function(err,product){
        done();          
      });

    });
        
  });

});

