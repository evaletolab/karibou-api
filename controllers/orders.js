
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    validate = require('./validate/validate'),
    errorHelper = require('mongoose-error-helper').errorHelper;


exports.ensureOwnerOrAdmin=function(req, res, next) {
  function isUserOrderOwner(){
    return (_.any(req.user.orders,function(s){return s===req.params.oid}));
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
  if(!isUserOrderOwner()){ 
    return res.send(401, "Your are not the owner of this shop"); 
  }
  
  return next();

}


/**
 * get orders by criteria
 * - closed order >=Date
 * - nextShippingDate
 * - created orders, when==Date
 * - limited to a shop, shop=slug
 * - limited to a user, id
 */
exports.list = function(req,res){    
  try{
    validate.ifCheck(req.params.uid, "Le format d'utilisateur n'est pas valide").isInt()
    validate.ifCheck(req.params.oid, "Le format de la commande n'est pas valide").isInt()
    validate.orderFind(req);
  }catch(err){
    return res.send(400, err.message);
  }  
  var criteria={}


  // restrict to an user
  if (req.params.uid){
    criteria.user=req.params.uid
  }

  // restrict to an order
  if (req.params.oid){
    criteria.oid=req.params.oid
  }

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,err);
    }
    return res.json(orders)
  });
};

exports.get = function(req,res){    
  try{
    validate.ifCheck(req.params.uid, "Le format d'utilisateur n'est pas valide").isInt()
    validate.check(req.params.oid, "Le format de la commande n'est pas valide").isInt()
  }catch(err){
    return res.send(400, err.message);
  }  
  
  Orders.find({oid:oid}).exec(function(err,order){
    if(err){
      return res.send(400,err);
    }
    return res.json(order)
  })
};

exports.verifyItems = function(req,res){   
  try{
    validate.orderItems(req.body.items)
  }catch(err){
    return res.send(400, err.message);
  }  

  var items=req.body.items;
  if(!items || !Array.isArray(items)){
    return res.send(400, "Vos articles ne sont pas valides");
  }
  
  db.model('Orders').checkItems(items,function(err,products, vendors, errors){
    if(err){
      return res.send(400, err);
    }
    return res.json({errors:errors})
  });
};


exports.paymentConfirmation=function(req,res){
}

exports.create=function(req,res){

  // check && validate input field
  try{
    validate.order(req);
  }catch(err){
    return res.send(400, err.message);
  }    
  

  Orders.create(req.body.items, req.user, req.body.shipping, req.body.payment, 
    function(err,order){
    if(err){
      return res.send(400, err);
    }      

    // items issue?
    if(order.errors){
      return res.json(200, order);
    }


    // order is prepared, now we are waiting for valid payment. 
    // Unless a full payment, order is closed and reserved products are available for everyone
    setTimeout(function(){
      order.findByTimeoutAndNotPaid().where('oid').equals(order.oid).exec(function(err,orders){
        if(err){
          return res.send(400, errorHelper(err));
        }
        order.rollbackProductQuantityAndSave(function(err){
          //
          // notify this order has been successfully modified
          bus.emit('order.rollback',null,order,items)

        })
      })
    },config.shop.order.timeoutAndNotPaid*1000)

    return res.json(order)

  });

};