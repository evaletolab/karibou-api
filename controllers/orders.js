
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    Orders = db.model('Orders'),
    _=require('underscore'),
    bus=require('../app/bus'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    csv = require('express-csv'),
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
    return res.json(Orders.filterByShop(orders,criteria.shop))
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
    return res.json(Orders.filterByShop(orders,criteria.shop))
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
          withHtml:true
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
      withHtml:true
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


//
// TODO multiple implement of send email, refactor it?
exports.informShopToOrders=function(req,res){
  try{
    if(!req.body.when)throw new Error('La date est obligatoire')
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 64).isSlug();
    validate.check(new Date(req.body.when),"La date n'est pas valide").isDate()
    validate.ifCheck(req.body.content,"Le votre message n'est pas valide (entre 3 et 600 caractères)").len(0, 600).isText();
  }catch(err){
    return res.send(400, err.message);
  }



  // TODO using promise would be better!
  db.model('Shops').findOne({urlpath:req.params.shopname}).populate('owner').exec(function(err,shop){
    if (err){
      return res.send(400,errorHelper(err));
    }
    if(!shop){
      return res.send(400,"Cette boutique n'existe pas");
    }


    var criteria={}
    parseCriteria(criteria,req)

    // restrict to a shopname
    criteria.shop=[req.params.shopname]

    // get the date
    criteria.when=new Date(req.body.when);


    Orders.findByCriteria(criteria, function(err,orders){
      if(err){
        return res.send(400,errorHelper(err));
      }


      //
      // get items
      var content={}, when=Orders.formatDate(orders[0].shipping.when), items=[];
      Orders.filterByShop(orders,req.params.shopname).forEach(function(order){
        order.items.forEach(function(item){
          item.rank=order.rank;
          item.name=order.customer.name;
          items.push(item)
        })
      })    


      content.shop=shop;
      content.shippingWhen=when;
      content.items=items;
      content.origin=req.header('Origin')||config.mail.origin;
      content.more=req.body.content||''
      content.withHtml=true;

      //
      // send email
      return bus.emit('sendmail',shop.owner.email.address,
                   "Karibou - Confirmation de vos préparations pour le "+when,
                   content,
                   "order-prepare", function(err, status){
        if(err){
          console.log('---------------------------prepare',err)
          return res.send(400,errorHelper(err));
        }

        res.json(200);
      })
    })

  });

}

//
// get CSV invoices
exports.invoicesByUsers=function(req,res){
  try{
    if(!req.params.month)throw new Error('Le mois est obligatoire');
    if(req.params.year){}
  }catch(err){
    return res.send(400, err.message);
  }

  var criteria={}, result=[];

  // get the date
  criteria.from=new Date();
  if(req.params.year){
    criteria.from.setYear(parseInt(req.params.year))
  }

  // select a shipping time
  criteria.from.setDate(1)
  criteria.from.setMonth(parseInt(req.params.month)-1)
  criteria.from.setHours(1,0,0,0)

  criteria.to=new Date(criteria.from);
  criteria.to.setDate(criteria.from.daysInMonth())
  criteria.to.setHours(23,0,0,0)
  criteria.fulfillment='fulfilled'

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,errorHelper(err));
    }
    // sort by date and customer
    function byDateAndUser(o1,o2){

      // asc date
      if(o1.shipping.when!==o2.shipping.when){
        if (o1.shipping.when > o2.shipping.when) return 1;
        if (o1.shipping.when < o2.shipping.when) return -1;
        return 0;
      }
      // asc email
      return o1.email.localeCompare(o2.email)
    }

    var amount=0,total=0,shipping=0;

    //
    // oid, date, customer, amount, fees, fees, total
    result.push(['oid','shipping','customer','amount','sfees','pfees','status','total'])
    orders.sort(byDateAndUser).forEach(function(order){
      result.push({
        oid:order.oid,
        shipping:order.shipping.when,
        customer:order.email,
        amount:order.getSubTotal().toFixed(2),
        shippingFees:config.shop.marketplace.shipping,
        paymentFees:payment.issuerFees(order.payment.issuer,order.getTotalPrice()).toFixed(2),
        payment:order.payment.status,
        total:order.getTotalPrice().toFixed(2)
      })
      total+=parseFloat(order.getTotalPrice().toFixed(2));
      amount+=parseFloat(order.getSubTotal().toFixed(2));
      shipping+=config.shop.marketplace.shipping;
    })
    result.push(['','','',amount,shipping,'','',total])

    res.setHeader('Content-disposition', 'attachment; filename=invoices-users-'+criteria.from.getMonth()+''+criteria.from.getYear()+'.csv');
    res.csv(result)

  });
}


//
// get CSV invoices
exports.invoicesByShops=function(req,res){
  try{
    if(!req.params.month)throw new Error('Le mois est obligatoire');
    if(req.params.year){}
  }catch(err){
    return res.send(400, err.message);
  }

  var criteria={}, result=[];

  // get the date
  criteria.from=new Date();
  if(req.params.year){
    criteria.from.setYear(parseInt(req.params.year))
  }
  // select a shipping time
  criteria.from.setDate(1)
  criteria.from.setMonth(parseInt(req.params.month)-1)
  criteria.from.setHours(1,0,0,0)


  criteria.to=new Date(criteria.from);
  criteria.to.setDate(criteria.from.daysInMonth())
  criteria.to.setHours(23,0,0,0)
  criteria.fulfillment='fulfilled'

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.send(400,errorHelper(err));
    }
    // sort by date and customer
    function byDateAndUser(o1,o2){

      // asc date
      if(o1.shipping.when!==o2.shipping.when){
        if (o1.shipping.when > o2.shipping.when) return 1;
        if (o1.shipping.when < o2.shipping.when) return -1;
        return 0;
      }
      // asc email
      return o1.customer.displayName.localeCompare(o2.customer.displayName)
    }

    var amount=0,total=0,shipping=0, shops={};
    result.push(['du',criteria.from])
    result.push(['au',criteria.to])
    result.push(['shop/oid','shipping','customer','qty','title','part','amount','total']);

    //
    // shopname
    //  
    shops=Orders.groupByShop(orders);
    Object.keys(shops).forEach(function(slug){
      result.push({slug:slug});
      total=amount=0;
      shops[slug].sort(byDateAndUser).forEach(function(item){
        if(item.fulfillment.status==='fulfilled' || req.query.all){
          result.push({
            oid:item.oid,
            shipping:item.shipping.when,
            customer:item.customer.displayName,
            quantity:item.quantity,
            title:item.title,
            part:item.part,
            price:item.price,
            finalprice:item.finalprice,
            fulfillment:item.fulfillment.status,
            note:item.note
          })
        }
        //
        //
        if(item.fulfillment.status==='fulfilled'){
          total+=parseFloat(item.finalprice.toFixed(2));
          amount+=parseFloat(item.price.toFixed(2));          
        }
      })
      result.push(['','','','','','',amount,total]);

    })

    res.setHeader('Content-disposition', 'attachment; filename=invoices-shops-'+criteria.from.getMonth()+''+criteria.from.getYear()+'.csv');
    res.csv(result)

  });
}
