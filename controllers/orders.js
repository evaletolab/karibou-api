
/*
 * orders
 */

var db=require('../app/config'),
    _=require('underscore');


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