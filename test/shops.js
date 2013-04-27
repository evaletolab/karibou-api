// Use a different DB for tests
// Use a different DB for tests
var app = require("../app/index");

var db = require("mongoose");
var Shops = db.model('Shops');


var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js"]);


describe("Shops", function(){
  var _ = require("underscore");


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
    

  it("Create a new Shop without catalog should throw an error ", function(done){
    var s={
      name: "Votre nouveau vélo en ligne",
      description:"cool ce shop",
      photo:{
        bg:"http://image.truc.io/bg-01123.jp",
        fg:"http://image.truc.io/fg-01123.jp"
      }    
    };
    Shops.create(s,data.Users[0], function(err,shop){
      should.exist(err);
      should.not.exist(shop);
      done();
    });
  });

  it("Create a new Shop ", function(done){
    var s={
      name: "Votre nouveau vélo en ligne",
      description:"cool ce shop",
      catalog:data.Categories[0]._id,
      photo:{
        bg:"http://image.truc.io/bg-01123.jp",
        fg:"http://image.truc.io/fg-01123.jp"
      }    
    };
    Shops.create(s,data.Users[0], function(err,shop){
      should.not.exist(err);
      shop.urlpath.should.equal("votre-nouveau-velo-en-ligne");
      done();
    });
  });

  it("Find One Shop", function(done){
    Shops.findOne({urlpath:"votre-nouveau-velo-en-ligne"},function(err,shop){
        //shop.user.id.should.equal(user.id);
        shop.name.should.equal("Votre nouveau vélo en ligne");
        done();
    });
  });

  it("Update shop", function(done){
    var s={
      name: "Votre nouveau vélo en ligne",
      description:"berk ce shop",
      photo:{
        bg:"bg",
        fg:"fg"
      }
    
    };
    Shops.update({name:s.name},s,function(err,shop){
        //shop.user.id.should.equal(user.id);
        shop.photo.fg.should.equal("fg");
        done();
    });
  });
  
  it("Update shop with wrong id",function(done){
    var s={
      name: "Votre nouveau vélo en ligne 2",
      description:"berk ce shop",
      photo:{
        bg:"bg",
        fg:"fg"
      }
    
    };
    Shops.update({name:s.name},s,function(err,shop){
        //shop.user.id.should.equal(user.id);
        err.should.be.a.string;
        done();
    });

  });
  
  it("Update shop with illegal field",function(done){
    var s={
      name: "Votre nouveau vélo en ligne",
      description:"berk ce shop",
      photo:{
        bg:"bg",
        fg:"fg"
      },
      options:{
        bio:"hello",
        avoid:"hello"
      }
    
    };
    Shops.update({name:s.name},s,function(err,shop){
        shop.options.bio.should.be.true;
        shop.options.should.not.have.property('avoid');
        done();
    });

  });
  
  it("Update shop without id",function(done){
    var s={
      name: "Votre nouveau vélo en ligne 2",
      description:"berk ce shop",
      photo:{
        bg:"bg",
        fg:"fg"
      }
    
    };
    Shops.update({},s,function(err,shop){
        //shop.user.id.should.equal(user.id);
        err.should.be.a.string;
        done();
    });

  });

  it("Update shop, remove  bg photo",function(done){
    var s={
      name: "Votre nouveau vélo en ligne",
      description:"berk ce shop",
      photo:{
        fg:"fg"
      }
    
    };
    Shops.update({name:s.name},s,function(err,shop){
        //shop.user.id.should.equal(user.id);
        shop.photo.fg.should.equal("fg");
        shop.photo.should.not.have.property('bg')
        done();
    });
  });
  

  it("Find Shops by the user", function(done){
    Shops.findByUser({id:data.Users[0].id},function(err,shops){
        shops[0].name.should.equal("Votre nouveau vélo en ligne");
        shops.length.should.equal(1);
        done();
    });
  });




});

