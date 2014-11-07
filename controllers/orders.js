
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    bus=require('../app/bus'),
    validate = require('./validate/validate'),
    postfinance = require('node-postfinance')
    errorHelper = require('mongoose-error-helper').errorHelper;


exports.ensureOwnerOrAdmin=function(req, res, next) {
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
  db.model('Orders').findOne({'customer.id':req.user.id,oid:req.params.oid}).exec(function(e,o){
    if(!o){
      return res.send(401, "Your are not the owner of this order");
    }
    next()
  })

}

exports.ensureShopOwnerOrAdmin=function(req, res, next) {
  //
  // ensure auth
  if (!req.isAuthenticated()) {
      return res.send(401);
  }

  // if admin, we've done here
  if (req.user.isAdmin())
    return next();


  // ensure that all items in this update bellongs to this user
  // req.user.shops.$.urlpathreq.body.items.$.vendor
  var slugs=_.collect(req.user.shops,function(p){return (p._id+'');})
  var items=(req.body.length)?req.body:[req.body]

  for(var item in items){
    // console.log('---------',slugs)
    // console.log('---------',items[item].sku,items[item].vendor, req.user.email.address)
    if(slugs.indexOf(items[item].vendor+'')==-1){
      return res.send(401,'Cet article '+items[item].sku+' n\'appartient pas à votre boutique')
    }
  }

  next();

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
 * get orders by shop.
 *   you get a list of order that contains only items concerning the shop
 * - closed=true||Date
 * - payment=pending||authorized||partially_paid||paid||partially_refunded||refunded||voided
 * - fulfillments=failure||created||reserved||partial||fulfilled"
 * - reason=customer||fraud||inventory||other
 * - when=next||Date
 * - created orders, when==Date
 * - limited to a shop, shopname=slug
 * - limited to a user, uid
 */
function parseCriteria(criteria, req){

  if (req.query.closed){
    criteria.closed=Date.parse(req.query.closed)
    if(!criteria.closed)criteria.closed=true
  }

  if (req.query.payment &&
      config.shop.order.financialstatus.indexOf(req.query.payment)!=-1){
    criteria.payment=req.query.payment
  }

  if (req.query.reason &&
      config.shop.order.cancelreason.indexOf(req.query.reason)!=-1){
    criteria.reason=req.query.reason
  }


  if (req.query.fulfillments &&
      config.shop.order.status.indexOf(req.query.fulfillments)!=-1){
    criteria.fulfillment=req.query.fulfillments
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

}
/**
 * get orders by criteria
 */
exports.list = function(req,res){
  try{
    validate.ifCheck(req.params.id, "L'utilisateur n'est pas valide").isInt()
    validate.ifCheck(req.params.oid, "La commande n'est pas valide").isInt()
    validate.ifCheck(req.params.shopname, "La boutique n'est pas valide").len(3, 34).isSlug()
    validate.orderFind(req);
  }catch(err){
    return res.send(400, err.message);
  }
  var criteria={}

  // restrict for open orders only
  criteria.closed=undefined;

  parseCriteria(criteria,req)

  // restrict to customer
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
 * get orders by shop.
 *   you get a list of order that contains only items concerning the shop
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

  parseCriteria(criteria,req)

  // restrict to a shopname
  criteria.shop=[req.params.shopname]

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,err);
    }
    return res.json(Orders.filterByShop([criteria.shop], orders))
  });
};

/**
 * get orders by shops for one owner.
 *   you get a list of order that contains only items concerning the shops
 */
exports.listByShopOwner = function(req,res){
  try{
    validate.orderFind(req);
  }catch(err){
    return res.send(400, err.message);
  }
  var criteria={}

  // restrict for open orders
  criteria.closed=null

  parseCriteria(criteria,req)

  // restrict shops to a user
  criteria.shop=req.user.shops.map(function(i){ return i.urlpath})

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
    try{
      var card=new postfinance.Card({
        alias: order.payment.alias.decrypt()
      })

      transaction = new postfinance.Transaction({
        operation: 'authorize',
        amount:order.getTotalPrice(config.payment.reserve),
        orderId: 'TX'+Date.now(),
        email:order.customer.email.address,
        groupId:(order.shipping.when+'').substring(0,14)
      });
    }catch(err){
      return res.json(400,err.message)
    }

    transaction.process(card, function(err,result){
      if(err){
        return order.rollbackProductQuantityAndSave(function(e){
          if(e){

            //
            //DANGER send email
            bus.emit('system.message',"[kariboo-danger] : ",{error:e,order:o.oid,customer:o.email});
          }
          return res.json(400,err.message)
        });
      }

      //
      // get authorisation, save status and transaction
      order.payment.status="authorized";
      order.payment.transaction=transaction.toJSON().crypt();
      order.save(function(err){
        if(err){
          return res.json(400,errorHelper(err))
        }
        return res.json(order)
      })

    });

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

exports.updateItem=function(req,res){

  // check && validate input item
  try{
    validate.ifCheck(req.params.oid, "La commande n'est pas valide").isInt()
    validate.orderItems(req.body,true); // true => do not check all fields
  }catch(err){
    return res.send(400, err.message);
  }


  Orders.updateItem(req.params.oid, req.body, function(err,order){
    if(err){
      return res.send(400, (err));
    }
    return res.json(200,order)
  });
}

exports.updateStatus=function(req,res){

}
