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



describe("users.likes", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");



  var db = require('mongoose');
  var fx = require('./fixtures/products');
  
  var profile;
  var p=_.clone(fx.p1);  
 

  var products, shop, cats, maker;


  // common befor/after
  before(function(done){
    fx.create_all(function(err,s,c,m,p){
      assert(!err);
      shop=s;cats=c;maker=m;products=p;
      done()
    })
  
  });


  describe("Likes products", function(){
    it("Customer likes a product ", function(done){
      async.waterfall([
        function(cb){
          Users.findOne({"email.address":"evaleto@gluck.com"},function(err,user){
            cb(err,user)
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
          Users.findOne({"email.address":"evaleto@gluck.com"}).populate("likes").exec(function(err,user){
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
      Users.findOne({"email.address":"evaleto@gluck.com"},function(err,user){
          assert(user);
          Products.findOneBySku(products[0].sku,function(err,product){
            user.removeLikes(product, function(err){
              assert(!err)
              Users.findOne({"email.address":"evaleto@gluck.com"}).populate("likes").exec(function(err,user){
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
          Users.findOne({"email.address":"evaleto@gluck.com"},function(err,user){
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
            Users.findOne({"email.address":"evaleto@gluck.com"}).populate("likes").exec(function(err,user){
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

