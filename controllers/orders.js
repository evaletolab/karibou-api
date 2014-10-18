
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    bus=require('../app/bus'),
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
    return res.send(401, "Your are not the owner of this order"); 
  }
  
  return next();

}

exports.ensureValidAlias=function(req,res,next){
  //
  // only authorize payment alias that belongs to user of the session
  // 
  var alias, issuer;
  if (req.params.alias) alias=req.params.alias;
  else if(req.body.alias) alias=req.body.alias;
  else if(req.body.payment.alias)alias=req.body.payment.alias;
  else return res.send(401,"Impossible de valider l'alias de paiement (1)")

  if(req.body.issuer) issuer=req.body.issuer;
  else if(req.body.payment.issuer)issuer=req.body.payment.issuer;
  else return res.send(401,"Impossible de valider l'alias de paiement (2)")


  if(!req.user.isValidAlias(alias,issuer)){
    return res.send(401,"La méthode de paiement utilisée n'est pas valide (0)")
  }

  return next();
}


/**
 * get orders by criteria
 * - closed order >=Date
 * - nextShippingDate
 * - created orders, when==Date
 * - limited to a shop, shopname=slug
 * - limited to a user, uid
 */
exports.list = function(req,res){    
  try{
    validate.ifCheck(req.params.id, "Le format d'utilisateur n'est pas valide").isInt()
    validate.ifCheck(req.params.oid, "Le format de la commande n'est pas valide").isInt()
    validate.ifCheck(req.params.shopname, "Le format de la boutique n'est pas valide").len(3, 34).isSlug()
    validate.orderFind(req);
  }catch(err){
    return res.send(400, err.message);
  }  
  var criteria={}

  // restrict for open orders only
  criteria.closed=null  

  if (req.query.status=='close'){
    criteria.closed=true
  }

  if (req.query.status=='paid'){
    criteria.paid=true
  }

  if (req.query.status=='fail'){
    criteria.payment='failure'
  }

  // get orders for next shipping day
  if (req.query.when=='next'){
    criteria.nextShippingDay=true
  }

  // get orders for specific date
  else if(req.query.when){
    var when=new Date(req.query.when)
    if(when!== "Invalid Date") criteria.when=when
  }

  // restrict to an user
  if (req.params.id){
    criteria.user=parseInt(req.params.id)
  }

  // restrict to an order
  if (req.params.oid){
    criteria.oid=parseInt(req.params.oid)
  }

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,err);
    }

    return res.json(orders)
  });
};

/**
 * get orders by shop. This function differ from the previous because for a shop and one date,
 *   you get a list of order that contains only items concerning the shop
 * - closed order >=Date
 * - nextShippingDate
 * - created orders, when==Date
 * - limited to a shop, shopname=slug
 * - limited to a user, uid
 */
exports.listByShop = function(req,res){    
  try{
    validate.check(req.params.shopname, "Le format de la boutique n'est pas valide").len(3, 34).isSlug()
    validate.orderFind(req);
  }catch(err){
    return res.send(400, err.message);
  }  
  var criteria={}

  // restrict for open orders
  criteria.closed=null

  if (req.query.status=='close'){
    criteria.closed=true
  }

  if (req.query.status=='paid'){
    criteria.paid=true
  }

  if (req.query.status=='fail'){
    criteria.payment='failure'
  }

  // get orders for next shipping day
  if (req.query.when=='next'){
    criteria.nextShippingDay=true
  }

  // get orders for specific date
  else if(req.query.when){
    var when=new Date(req.query.when)
    if(when!== "Invalid Date") criteria.when=when
  }

  // restrict to a shopname
  criteria.shop=req.params.shopname





  // console.log("find orders",criteria)
  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,err);
    }
    return res.json(Orders.filterByShop(criteria.shop, orders))
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
    validate.order(req.body);
  }catch(err){
    return res.send(400, err.message);
  }    
  

  Orders.create(req.body.items, req.user, req.body.shipping, req.body.payment, 
    function(err,order){
    if(err){
      return res.send(400, errorHelper(err));
    }      

    // items issue?
    if(order.errors){
      return res.json(200, order);
    }

    var oid=order.oid;

    // order is prepared, now we are waiting for valid payment. 
    // Unless a full payment, order is closed and reserved products are available for everyone
    // TODO replace timeout by node-postfinance here!!
    //
    // payment workflow:
    //    - 1) get auth 2) prepare 3) cancel||paid  4) issue||ok
    order.payment.status="authorized";
    order.save(function(err){
      if(err){
        return res.json(401,errorHelper(err))
      }
      return res.json(order)
    })

    // setTimeout(function(){
    //   //
    //   Orders.findByTimeoutAndNotPaid().where('oid').equals(oid).exec(function(err,order){
    //     if(err){
    //       return res.send(400, errorHelper(err));
    //     }

    //     order[0].rollbackProductQuantityAndSave(function(err){
    //       //
    //       // notify this order has been successfully rollbacked
    //       bus.emit('order.rollback',null,order)

    //     })
    //   })
    // },config.shop.order.timeoutAndNotPaid*1000)
    // return res.json(order)


  });

};