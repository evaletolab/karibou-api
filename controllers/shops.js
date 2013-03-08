
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


function check(req){
    if (!req.body)return;
    if(req.body.name) check(req.body.name,"Invalide characters for shop name").len(3, 34).isAlphanumeric();
    if(req.body.description){
      //check(req.body.description).len(4, 104,"Invalide characters for shop description").isAlphanumeric();
      req.body.description=sanitize(req.body.description).xss();
    }
    if(req.body.photo.bg) check(req.body.photo.bg).len(6, 164).isUrl();
    if(req.body.photo.fg) check(req.body.photo.fg).len(6, 164).isUrl();
    
}

exports.create=function (req, res) {

  try{
    check(req);
  }catch(err){
    return res.send(401, err.message);
  }  

  db.model('Shops').create(req.body, req.user, function(err,shop){
    if(err){
      //TODO error
    	res.status(401);
      return res.json({error:err});
    }      
    res.json(shop);
  });
};

exports.remove=function (req, res) {

  try{
    check(req.params.shopname, "Invalid characters for shop name").len(3, 34).is(/^[a-z0-9-]+$/);    
  }catch(err){
    return res.send(401, err.message);
  }  

  if(!_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname})){
    // FOR DEV ONLY!
    //return res.send(401, {error:"Your are not the owner of this shop"});
  }


  db.model('Shops').remove({urlpath:req.params.shopname},function(err){
    if (err){
    	res.status(401);
      return res.json({error:err});    
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
    return res.send(401, err.message);
  }
    
  Shops.findOneShop({urlpath:req.params.shopname},function (err,shop){
    if (err){
    	res.status(401);
      return res.json({error:err});    
    }
    
    if (!shop){
      res.status(401);
      return res.json({error:("Cannot find the shop "+req.params.shopname)});    
    }

    return res.json(shop);  
  });
};

exports.update=function(req,res){
  //
  // check && validate input field
  try{
    check(req.params.shopname, "Invalid characters for shop name").len(3, 34).is(/^[a-z0-9-]+$/);    
    check(req);
  }catch(err){
    return res.send(401, err.message);
  }  


  if(!_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname})){
    return res.send(401, {error:"Your are not the owner of this shop"});
  }

  if(!req.body.owner)req.body.owner=req.user;
  Shops.update({urlpath:req.params.shopname},req.body,function(err,shop){
    if (err){
    	res.status(401);
      return res.json({error:err});    
    }
    return res.json(shop);  
  });

};

exports.list=function (req, res) {
  Shops.find({})/*.where("status",true)*/.exec(function (err,shops){
    if (err){
    	res.status(401);
      return res.json({error:err});    
    }
    

    return res.json(shops);  
  });

};
