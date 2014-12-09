
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    bus=require('../app/bus'),
    validate = require('./validate/validate'),
    payment = require('../app/payment')
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
  var slugs=_.collect(req.user.shops,function(p){return (p.urlpath+'');})
  var items=(req.body.length)?req.body:[req.body]

  for(var item in items){
    //console.log('---------',req.user.email.address,slugs)
    //console.log('---------',items[item].vendor,items[item].vendor, req.user.email.address)
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

  if(req.body.issuer) issuer=req.body.issuer;
  else if(req.body.payment.issuer)issuer=req.body.payment.issuer;
  else return res.send(401,"Impossible de valider l'alias de paiement (2)")

  //
  // FIXME HUGLY FIX
  if(issuer==='invoice'){
    return next();
  }

  if (req.params.alias) alias=req.params.alias;
  else if(req.body.alias) alias=req.body.alias;
  else if(req.body.payment.alias)alias=req.body.payment.alias;
  else return res.send(401,"Impossible de valider l'alias de paiement (1)")

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
    criteria.when=Orders.findNextShippingDay();
  }

  if (req.query.when=='current'){
    criteria.when=Orders.findCurrentShippingDay();
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
    return res.json(Orders.filterByShop(criteria.shop, orders))
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
    validate.check(req.params.oid, "Le format de la commande n'est pas valide").isInt()
  }catch(err){
    return res.send(400, err.message);
  }

  Orders.findOne({oid:req.params.oid}).exec(function(err,order){
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



//
// create a new order
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
    payment.for(order.payment.issuer).authorize(order)
      .then(function(order){
        //
        // prepare and send mail
        var mail={
          order:order,
          created:order.getDateString(order.created),
          shippingFees:config.shop.marketplace.shipping,
          subTotal:order.getSubTotal(),
          paymentFees:payment.issuerFees(order.payment.issuer,order.getTotalPrice()).toFixed(2),
          totalWithFees:order.getTotalPrice().toFixed(2),
          shippingWhen:order.getDateString(),
          subTotal:order.getSubTotal().toFixed(2),
          origin:req.header('Origin')||config.mail.origin,
          withHtml:false
        };
        bus.emit('sendmail',  
            order.email,
            'Confirmation de votre commande Karibou '+order.oid,
            mail,
            'order-new',
            function(err,status){
              //TODO log activities
              if(err)console.log('---------------------------create',order.oid,err)
            })
        return res.json(order)
      })
      .fail(function(err){
        bus.emit('system.message',"[order-danger] :",{error:err.message,order:order.oid,customer:order.email});
        return res.json(400,err.message)        
      })
  });

};

//
// cancel order 
exports.cancel=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.send(400, err.message);
  }
  db.model('Orders').onCancel(req.params.oid,req.body.reason,function(err,order){
    if(err){
      return res.send(400, errorHelper(err));
    }

    //
    // prepare and send mail
    var mail={
      order:order,
      created:order.getDateString(order.created),
      origin:req.header('Origin')||config.mail.origin,
      withHtml:false
    };
    bus.emit('sendmail',  
        order.email,
        'Annulation de votre commande Karibou '+order.oid,
        mail,
        'order-cancel',
        function(err,status){
          //TODO log activities
          if(err)console.log('---------------------------cancel',order.oid,err)
        })

    return res.json(200,order)
  })
}


//
// capture current order with finalprice
exports.capture=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.send(400, err.message);
  }

  db.model('Orders').findOne({oid:req.params.oid}).select('+payment.transaction').exec(function(err,order){
    if(err){
      return res.send(400, errorHelper(err));
    }

    // items issue?
    if(!order){
      return res.json(400, "La commande "+req.params.oid+" n'existe pas.");
    }


    payment.for(order.payment.issuer).capture(order)
      .then(function(order){

        //
        // prepare and send mail
        var mail={
          order:order,
          created:order.getDateString(order.created),
          shippingFees:config.shop.marketplace.shipping,
          subTotal:order.getSubTotal(),
          paymentFees:payment.issuerFees(order.payment.issuer,order.getTotalPrice()).toFixed(2),
          totalWithFees:order.getTotalPrice().toFixed(2),
          shippingWhen:order.getDateString(),
          subTotal:order.getSubTotal().toFixed(2),
          origin:req.header('Origin')||config.mail.origin,
          withHtml:false
        };
        bus.emit('sendmail',  
            order.email,
            'Facture de votre commande Karibou '+order.oid,
            mail,
            'order-billing',
            function(err,status){
              //TODO log activities
              if(err)console.log('---------------------------capture',order.oid,err)
            })


        return res.json(order)
      })
      .fail(function(err){
        bus.emit('system.message',"[order-danger] :",{error:err.message,order:order.oid,customer:order.email});
        return res.json(400,err.message)        
      })


  })

}

//
// delete order 
exports.remove=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.send(400, err.message);
  }

  return Orders.findOne({oid:req.params.oid}).exec(function(err,order){
    if(err){
      return res.send(400, errorHelper(err));
    }

    if(!order){
      return res.send(400,"La commande n'existe pas")
    }

    // constraint the remove?
    //if(['voided','refunded'].indexOf(order.payment.status)===-1){
    //  return res.send(400,"Impossible de supprimer une commande avec le status: "+order.payment.status))
    //}

    // delete
    order.remove(function(err){
      if(err)return res.json(400,errorHelper(err))
      return res.json(200,{})
    });

  });
}

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
