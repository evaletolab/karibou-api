
/*
 * home
 */

var db=require('../app/config');
var _=require('underscore');
var assert = require("assert");

var db = require('mongoose');
var Shops = db.model('Shops');

exports.create=function (req, res) {

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
  assert(req.params.shopname);    
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
  // check shop owner 
  assert(req.params.shopname);    
  if(!_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname})){
    return res.send(401, {error:"Your are not the owner of this shop"});
  }
  
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
