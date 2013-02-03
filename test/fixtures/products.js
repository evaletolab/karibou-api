
var async     = require("async");
  
var mongoose  = require("mongoose");
var Products  = mongoose.model('Products');
var Shops     = mongoose.model('Shops');
var Users     = mongoose.model('Users');
var Sequences = mongoose.model('Sequences');
var Categories= mongoose.model('Categories');


exports.clean=function(callback){
  async.waterfall([
    function(cb){
      Sequences.remove({}, function(e) {
        cb(e);
      });
    }
    ,
    function(cb){
      Users.remove({}, function(e) {
        cb(e);
      });    
    },
    function(cb){
      Products.remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      Categories.remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      Shops.remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      mongoose.model('Manufacturers').remove({}, function(e) {
        cb(e);
      });
    }
  ],
  function(e,r){
    callback(e,r);
  });
};



exports.create_all_but_product=function(user,callback){
  async.waterfall([
    // create some categories
    function(cb){
      Categories.create(["Fruits", "Légumes", "Poissons"],function(err,cats){
        cb(err, cats);
      });
      
    },
    function(cats,cb){
      // create some manufacturers
      mongoose.model('Manufacturers').create({name:'roman', description:'cool', location:'Genève'},function(err,m){
        cb(err,cats, m);   
      });
    },    
    // create shop
    function(cats,maker, cb){
      var s={
        name: "Votre vélo en ligne",
        description:"cool ce shop",
        bgphoto:"http://image.truc.io/bg-01123.jp",
        fgphoto:"http://image.truc.io/fg-01123.jp"
      
      };
      Shops.create(s,user, function(err,shop){
       cb(err,cats, maker, shop);
      });      
    },
  ],
  function(err,cats, maker, shop){
    callback(err, cats, shop, maker);
  });
};


