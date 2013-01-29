
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
    }
  ],
  function(e,r){
    callback(e,r);
  });
};

exports.creates=function(user,callback){
  async.waterfall([
    // create some categories
    function(cb){
      Categories.create(["Fruits", "Légumes", "Poissons"],function(err,cats){
        cb(err, cats);
      });
      
    },
    // create shop
    function(cats, cb){
      var s={
        name: "Votre vélo en ligne",
        description:"cool ce shop",
        bgphoto:"http://image.truc.io/bg-01123.jp",
        fgphoto:"http://image.truc.io/fg-01123.jp"
      
      };
      Shops.create(s,user, function(err,shop){
       cb(err,cats, shop);
      });      
    },
    // create some categories
    function(cats, shop, cb){
      var p={
         title: "01 Pâtes complètes à l'épeautre ''bio reconversion'' 500g",
         
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
      Products.create(p,shop,function(err,product){
        product.addCategories(cats[0]);
        
        cb(err,cats, shop, product);
      });
    },
    function(cats,shop, p1, cb){

      var p={
         title: "02 Pâtes complètes à l'épeautre ''bio reconversion'' 500g",
         
         details:{
            description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
            comment:"Temps de cuisson : 16 minutes",
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
      Products.create(p,shop,function(err,p2){
        p2.addCategories(cats[1]);
        cb(err,cats,shop,[p1, p2]);
      });
    }
    
  ],
  function(err,cats, shop, ps){
    callback(err, cats, shop, ps);
  });
};
