// Use a different DB for tests
// Use a different DB for tests
var app = require("../app");

var db = require("mongoose");

var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.js"]);
var Users=db.model('Users');

describe("users.likes", function(){
  var async= require("async");
  var _ = require("underscore");

  // common befor/after
  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });


  it("Customer likes a product ", function(done){
    async.waterfall([
      function(cb){
        Users.findOne({"email.address":"evaleto@gluck.com"},function(err,user){
          should.not.exist(err);
          cb(err,user)
        });
      },
      function(user,cb){
        db.model('Products').findOneBySku(data.Products[0].sku,function(err,product){
          user.addLikes(product.sku,function(err){
            cb(err);
          });
        });
      }
      ,
      function(cb){
        Users.findOne({"email.address":"evaleto@gluck.com"}).exec(function(err,user){
          should.exist(user.likes.length);
          //console.log(user);
          cb(null,user);
        });
      }]
      ,    
      function(err,user){
        should.not.exist(err);
        //FIXME once likes was NULL ??? check this if it repeats
        user.likes[0].should.equal(data.Products[0].sku);
        done();
      });
  });

  it("Customer unlikes a product ", function(done){
    Users.findOne({"email.address":"evaleto@gluck.com"},function(err,user){
        should.exist(user);
        db.model('Products').findOneBySku(data.Products[0].sku,function(err,product){
          user.removeLikes(product.sku, function(err){
            should.not.exist(err)
            Users.findOne({"email.address":"evaleto@gluck.com"}).exec(function(err,user){
              user.likes.length.should.equal(0);
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
          should.exist(user);
          cb(err,user);
        });
      },
      function(user,cb){
        db.model('Products').findOneBySku(data.Products[0].sku,function(err,product){
          user.addLikes(product.sku,function(err){
            cb(err,user, product);
          });
        });
      }
      ,
      function(user, product,cb){
          db.model('Products').findOne({sku:data.Products[0].sku},function (e,product) {
            product.remove(function(err){
              setTimeout(function() {
                cb(err,user,product);                
              }, 100);
            });
          })
      },
      function(user,product,cb){
          Users.findOne({"email.address":"evaleto@gluck.com"}).exec(function(err,user){
            user.likes.length.should.equal(0);
            done();
          });
      }
    ],function(err,result){
      should.not.exist(err);
    });

  });



});

