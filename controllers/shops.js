
/*
 * home
 */

var app=require('../app/config');
var _=require('underscore');
var assert = require("assert");

var db = require('mongoose');
var Shops = db.model('Shops');
var ObjectId = db.Types.ObjectId;


var check = require('validator').check,
    sanitize = require('validator').sanitize;

exports.ensureShopLimit=function(req, res, next) {
  if (!req.user.isAdmin() && req.user.shops.length>0){
    return res.send(401, "Vous ne pouvez plus ajouter de nouvelles boutiques"); 
  }
  return next(); 
}
    
exports.ensureOwnerOrAdmin=function(req, res, next) {
  function isUserShopOwner(){
    return (_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname}));
  }
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if admin, we've done here
  if (req.user.isAdmin()) 
    return next();  

  //
  // ensure owner
	if(!isUserShopOwner()){ 
    return res.send(401, "Your are not the owner of this shop"); 
	}
	
  return next();

}
    
    

function checkParams(req){
    if (!req.body)return;

    if(req.body.name) check(req.body.name,"Le nom n'est pas valide ou trop long").len(3, 48);//.is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    if(req.body.description){
      check(req.body.description,"La description n'est pas valide ou trop longue").len(3, 400);
      req.body.description=sanitize(req.body.description,"La description n'est pas valide").xss();
    }
    
    if(req.body.url) check(req.body.url).len(6, 164).isUrl();

    if (req.body.photo){
      req.body.photo.bg && check(req.body.photo.bg).len(6, 164).isUrl();
      req.body.photo.fg && check(req.body.photo.fg).len(6, 164).isUrl();
      req.body.photo.owner && check(req.body.photo.owner).len(6, 164).isUrl();
    }
    
    if (req.body.options){
      req.body.options.bio && check(req.body.options.bio).is(/^(true|false)$/);
      req.body.options.gluten && check(req.body.options.gluten).is(/^(true|false)$/);
      req.body.options.lactose && check(req.body.options.lactose).is(/^(true|false)$/);
      req.body.options.local && check(req.body.options.local).is(/^(true|false)$/);
    }
    
    for (var i in req.body.faq){      
      check(req.body.faq[i].q,"La question n'est pas valide ou trop longue").len(3, 128);//.is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=? ]+$/);
      check(req.body.faq[i].a,"La réponse n'est pas valide ou trop longue").len(3, 400);//.is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?` ]+$/);
    }
    
    if (req.body.available){
      req.body.available.active && check(req.body.available.active).is(/^(true|false)$/);
      req.body.available.comment && check(req.body.available.comment,"Le commentaire n'est pas valide ou trop long").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }

    if (req.body.info){
      req.body.info.active && check(req.body.info.active).is(/^(true|false)$/);
      req.body.info.comment && check(req.body.info.comment,"Le format du commentaire n'est pas valide").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }
      
    //marketplace: [{type: String, required: false, enum: EnumPlace, default:config.shop.marketplace.default}],
    //location: {type: String, required: false, enum: EnumLocation},
    
}

exports.create=function (req, res) {

  try{
    checkParams(req);
  }catch(err){
    return res.send(400, err.message);
  }  

  db.model('Shops').create(req.body, req.user, function(err,shop){
    if(err){
      //TODO error
    	res.status(400);
      return res.json(err);
    }      
    res.json(shop);
  });
};

exports.remove=function (req, res) {

  try{
    check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).is(/^[a-z0-9-]+$/);    
  }catch(err){
    return res.send(400, err.message);
  }  

  //
  // check admin or owner
  // delegated 


  db.model('Shops').remove({urlpath:req.params.shopname},function(err){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    return res.send(200);
  });
};


exports.get=function (req, res) {
  //
  // check shop owner 
  try{
    check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).is(/^[a-z0-9-]+$/);    
  }catch(err){
    return res.send(400, err.message);
  }
    
  Shops.findOneShop({urlpath:req.params.shopname},function (err,shop){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    
    if (!shop){
      res.status(400);
      return res.json("Cannot find the shop "+req.params.shopname);    
    }

    return res.json(shop);  
  });
};

exports.update=function(req,res){
  //
  // check && validate input field
  try{
    check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).is(/^[a-z0-9-]+$/);    
    checkParams(req);
  }catch(err){
    return res.send(400, err.message);
  }  


  //
  // check admin or owner
  // delegated 
  
  Shops.update({urlpath:req.params.shopname},req.body,function(err,shop){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    return res.json(shop);  
  });

};

exports.list=function (req, res) {
  //
  // check && validate input field
  try{
    req.params.category&&check(req.params.category, "Le format de la catégorie n'est pas valide").is(/^[a-z0-9-]+$/)
    req.query.valid&&check(req.query.valid, "Le format de validation n'est pas valide").is(/^(true|false|yes|no)$/);    
    req.query.group&&check(req.query.group, "Le format de groupe n'est pas valide").len(1, 34).is(/^[a-z0-9-.]+$/);    
  }catch(err){
    return res.send(400, err.message);
  }  

  function getShops(where){
    var query=Shops.find(where);


    if (req.query.sort){
      console.log("sort shop by creation date: ",req.query.sort);
      query=query.sort(req.query.sort);
    }
    
    // filter 
    if(req.query.status){
      query=query.where("status",true);
    }
    
    //
    //FILTER only visible shop are available: 
    //       if (req.user._id == shop.owner || shop.status==true)
    var filter=[{'status':true}];
    if(req.user){
      filter.push({'owner':req.user._id});
    }    
    query=query.or(filter);
    
    
    query.populate('catalog').exec(function (err,shops){
      if (err){
      	res.status(400);
        return res.json(err);    
      }
      //
      // as we dont know how to group by with mongo
      if (req.query.group){
        grouped=_.groupBy(shops,function(shop){
          return shop.catalog&&shop.catalog.name;
        });
        return res.json(grouped);
      }
    
      return res.json(shops);  
    });
  }
  
  if (req.params.category){
    return db.model('Categories').findBySlug(req.params.category,function(e,c){
      if (e){
        return res.send(400,e);
      }
      if (!c){
        return res.send(400,"Il n'existe pas de catégorie "+req.params.category);
      }
      return getShops({catalog:c._id});
    });    
  }
  return getShops({});
  
};
