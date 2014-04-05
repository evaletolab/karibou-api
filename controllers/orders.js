
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    validate = require('./validate/validate'),
    errorHelper = require('mongoose-error-helper').errorHelper;



exports.list = function(req,res){    
};

exports.verify = function(req,res){   
  var cart=req.body.cart;
  if(!cart || !Array.isArray(cart)){
    return res.send(400, "invalid cart.");
  }
  
  db.model('Orders').checkItems(cart,function(err,products){
    if(err){
      return res.send(400, err);
    }
    return res.json(cart)
  });
};

exports.create=function(req,res){

  // check && validate input field
  try{
    validate.check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();    
    validate.order(req);
  }catch(err){
    return res.send(400, err.message);
  }  

  // check value from config.shop.order.timeoutAndNotPaid
  //order.findByTimeoutAndNotPaid(function(err,orders){})
  //order.rollbackProductQuantityAndSave(function(err){})
}