
/*
 * home
 */

var db=require('../app/config');
var _=require('underscore');
var assert = require("assert");

var db = require('mongoose');
var Shops = db.model('Shops');

var check = require('validator').check,
    sanitize = require('validator').sanitize;

    
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

    if(req.body.name) check(req.body.name.replace(/ /g,''),"Invalide characters for shop name").len(3, 34).is(/^[a-zA-ZÀ-ÿ0-9' ]+$/);
    if(req.body.description){
      req.body.description=sanitize(req.body.description).xss();
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
    
    for (var faq in req.body.faq){
      check(faq.q).len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9' ]+$/);
      check(faq.a).len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9' ]+$/);
    }
    
    if (req.body.available){
      req.body.available.active && check(req.body.available.active).is(/^(true|false)$/);
      req.body.available.comment && check(req.body.available.comment).len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9' ]+$/);
    }

    if (req.body.info){
      req.body.info.active && check(req.body.info.active).is(/^(true|false)$/);
      req.body.info.comment && check(req.body.info.comment).len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9' ]+$/);
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
      console.log(err);
    	res.status(400);
      return res.json(err);
    }      
    res.json(shop);
  });
};

exports.remove=function (req, res) {

  try{
    check(req.params.shopname, "Invalid characters for shop name").len(3, 34).is(/^[a-z0-9-]+$/);    
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
    check(req.params.shopname, "Invalid characters for shop name").len(3, 34).is(/^[a-z0-9-]+$/);    
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
    check(req.params.shopname, "Invalid characters for shop name").len(3, 34).is(/^[a-z0-9-]+$/);    
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
  Shops.find({})/*.where("status",true)*/.exec(function (err,shops){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    

    return res.json(shops);  
  });

};
