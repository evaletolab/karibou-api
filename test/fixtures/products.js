
var async     = require("async");
  
var db  = require("mongoose");
var _ = require("underscore");
var assert = require("assert");

var p1=exports.p1={
     title: "Test product bio 1",
     
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
     }
  };
  
var p2=exports.p2={
         title: "Test product 2",
         
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

exports.p3={
         title: "Test product bio 3",
         
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

var clean=exports.clean=function(callback){
  async.waterfall([
    function(cb){
      db.model('Sequences').remove({}, function(e) {
        cb(e);
      });
    }
    ,
    function(cb){
      db.model('Users').remove({}, function(e) {
        cb(e);
      });    
    },
    function(cb){
      db.model('Products').remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      db.model('Categories').remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      db.model('Shops').remove({}, function(e) {
        cb(e);
      });
    },
    function(cb){
      db.model('Manufacturers').remove({}, function(e) {
        cb(e);
      });
    }
  ],
  function(e,r){
    callback(e,r);
  });
};



var create_base=exports.create_base=function(user,callback){
  async.waterfall([
    // create some categories
    function(cb){
      db.model('Categories').create(["Fruits", "Légumes", "Poissons"],function(err,cats){
        cb(err, cats);
      });
      
    },
    function(cats,cb){
      // create some manufacturers
      db.model('Manufacturers').create({name:'roman', description:'cool', location:'Genève'},function(err,m){
        cb(err,cats, m);   
      });
    },    
    // create shop
    function(cats,maker, cb){
      var s={
        name: "Votre vélo en ligne",
        description:"cool ce shop",
        photo:{ 
          bg:"http://image.truc.io/bg-01123.jp",
          fg:"http://image.truc.io/fg-01123.jp"      
        }
      
      };
      db.model('Shops').create(s,user, function(err,shop){
       cb(err,cats, maker, shop);
      });      
    },
  ],
  function(err,cats, maker, shop){
    callback(err, cats, shop, maker);
  });
};


exports.create_all=function(callback){
  var shop, cats, maker, profile, products=[];

  async.waterfall([
    function(cb){
      clean(function(err){
        cb(err);
      });
    },
    function(cb){
      // registered new user with password and provider
      db.model('Users').register("evaleto@gluck.com", "olivier", "evalet", "mypwd", "mypwd", function(err, user){
        profile=user;
        cb(err);   
      });
    },
    function(cb){
      create_base(profile,function(err, c, s, m){
        shop = s;
        cats = c;
        maker= m;
        cb(err);  
      });


    },
    function(cb){
      //
      // set the manfacturer
      
      var p=_.clone(p1);
      p.manufacturer=maker;
      p.categories=[cats[0]];
      db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
        assert(shops);
        db.model('Products').create(p,shops[0],function(err,product){
          products.push(product);
          cb(err)  
        });
      });
    },
    function(cb){

      var p=_.clone(p2);
      p.manufacturer=maker;
      p.categories=[cats[1]];
      db.model('Shops').findByUser({"email.address":"evaleto@gluck.com"},function(err,shops){
        assert(shops);
        db.model('Products').create(p,shops[0],function(err,product){
          products.push(product);
          cb(err)  
        });
      });

    }],
    function(err,r){
      callback(err,shop,cats,maker,products);
    });
}


