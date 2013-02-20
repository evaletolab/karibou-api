
/*
 * home
 */

var db=require('../app/config');
var _=require('underscore');
var assert = require("assert");

var db = require('mongoose');
var Shops = db.model('Shops');

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
