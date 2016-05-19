
/*
 * orders
 */

require('../app/config');

var db = require('mongoose'),
    _=require('underscore'),
    Orders = db.model('Orders'),
    Q = require('q'),
    bus=require('../app/bus'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    csv = require('express-csv'),
    errorHelper = require('mongoose-error-helper').errorHelper;




exports.ensureOwnerOrAdmin=function(req, res, next) {
  //
  // ensure auth
  if (!req.isAuthenticated()) {
      return res.sendStatus(401);
  }

  // if admin, we've done here
  if (req.user.isAdmin())
    return next();

  //
  // ensure owner
  db.model('Orders').findOne({'customer.id':req.user.id,oid:req.params.oid}).exec(function(e,o){
    if(!o){
      return res.status(401).send( "Your are not the owner of this order");
    }
    next()
  })

}

exports.ensureHasShopOrAdmin=function(req, res, next) {
  //
  // ensure auth
  if (!req.isAuthenticated()) {
      return res.sendStatus(401);
  }

  // if admin, we've done here
  if (req.user.isAdmin())
    return next();

  if(!req.user.shops || !req.user.shops.length){
    return res.status(401).send("Vous n'avez pas de boutique")
  }


  return next();
};

exports.ensureShopOwnerOrAdmin=function(req, res, next) {
  //
  // ensure auth
  if (!req.isAuthenticated()) {
      return res.sendStatus(401);
  }

  // if admin, we've done here
  if (req.user.isAdmin())
    return next();

  if(!req.user.shops || !req.user.shops.length){
    return res.status(401).send("Vous n'avez pas de boutique boutique")
  }
  // ensure that all items in this update bellongs to this user
  // req.user.shops.$.urlpathreq.body.items.$.vendor
  var slugs=_.collect(req.user.shops,function(p){return (p.urlpath+'');})
  var items=(req.body.length)?req.body:[req.body]

  for(var item in items){
    //console.log('---------',req.user.email.address,slugs)
    //console.log('---------',items[item].vendor,items[item].vendor, req.user.email.address)
    if(slugs.indexOf(items[item].vendor+'')==-1){
      return res.status(401).send('Cet article '+items[item].sku+' n\'appartient pas à votre boutique')
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
  else return res.status(401).send("Impossible de valider l'alias de paiement (2)")

  //
  // FIXME HUGLY FIX
  if(issuer==='invoice'){
    return next();
  }

  if (req.params.alias) alias=req.params.alias;
  else if(req.body.alias) alias=req.body.alias;
  else if(req.body.payment.alias)alias=req.body.payment.alias;
  else return res.status(401).send("Impossible de valider l'alias de paiement (1)")

  if(!req.user.isValidAlias(alias,issuer)){
    return res.status(401).send("La méthode de paiement utilisée n'est pas valide (0)")
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
      config.shared.order.financialstatus.indexOf(req.query.payment)!=-1){
    criteria.payment=req.query.payment
  }

  if (req.query.reason &&
      config.shared.order.cancelreason.indexOf(req.query.reason)!=-1){
    criteria.reason=req.query.reason
  }


  if (req.query.fulfillments){
    // check all status? generate error?
    req.query.fulfillments.split(',').forEach(function (fulfillment) {
      // (config.shared.order.status.indexOf(fulfillment)!=-1)
    })
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

  // select order year
  var year=req.query.year||req.params.year;
  if(year){
    criteria.from=new Date();
    criteria.from.setYear(parseInt(year))
  }

  // select order month
  var month=req.query.month||req.params.month;
  if(month){
    if(!criteria.from)criteria.from=new Date()
    criteria.from.setDate(1)
    criteria.from.setMonth(parseInt(month)-1)
    criteria.from.setHours(1,0,0,0)
  }

  if(criteria.from){
    criteria.to=new Date(criteria.from);
    criteria.to.setDate(criteria.from.daysInMonth());
    criteria.to.setHours(23,0,0,0);    
  }

  //
  // specify the padding option to add one week after the "to" date
  if(req.query.padding){
    criteria.padding=true
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
    return res.status(400).send( err.message);
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
      return res.status(400).send(err);
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
    return res.status(400).send( err.message);
  }
  var criteria={}

  // restrict for open orders
  criteria.closed=null

  parseCriteria(criteria,req)

  // restrict to a shopname
  criteria.shop=[req.params.shopname]

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.status(400).send(err);
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
    return res.status(400).send( err.message);
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
      return res.status(400).send(err);
    }
    return res.json(Orders.filterByShop(orders,criteria.shop))
  });
};


exports.get = function(req,res){
  try{
    validate.check(req.params.oid, "Le format de la commande n'est pas valide").isInt()
  }catch(err){
    return res.status(400).send( err.message);
  }

  Orders.findOne({oid:req.params.oid}).exec(function(err,order){
    if(err){
      return res.status(400).send(err);
    }
    return res.json(order)
  })
};

exports.verifyItems = function(req,res){
  try{
    validate.orderItems(req.body.items)
  }catch(err){
    return res.status(400).send( err.message);
  }

  var items=req.body.items;
  if(!items || !Array.isArray(items)){
    return res.status(400).send( "Vos articles ne sont pas valides");
  }

  db.model('Orders').checkItems(items,function(err,products, vendors, errors){
    if(err){
      return res.status(400).send( err);
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
    return res.status(400).send( err.message);
  }

  Orders.create(req.body.items, req.user, req.body.shipping, req.body.payment,
    function(err,order){
    if(err){
      return res.status(400).send( errorHelper(err.message||err));
    }


    // items issue?
    if(order.errors){
      return res.json( order);
    }

    var oid=order.oid;
    payment.for(order.payment.issuer).authorize(order)
      .then(function(order){
        //
        // prepare and send mail
        var subTotal=order.getSubTotal(),shippingFees=order.getShippingPrice();
        var mail={
          order:order,
          created:order.getDateString(order.created),
          shippingFees:shippingFees,
          paymentFees:payment.fees(order.payment.issuer,subTotal+shippingFees).toFixed(2),
          totalWithFees:order.getTotalPrice().toFixed(2),
          shippingWhen:order.getDateString(),
          subTotal:subTotal.toFixed(2),
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
        bus.emit('system.message',"[order-create] :",{error:err.message,order:order.oid,customer:order.email});
        return res.json(400,err.message||err)        
      })
  });

};


exports.updateItem=function(req,res){

  // check && validate input item
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
    validate.orderItems(req.body,true); // true => do not check all fields
  }catch(err){
    return res.status(400).send( err.message);
  }


  //
  // verify owner
  // no admin should not get all order details
  var shop=_.collect(req.user.shops,function (shop) {
    return shop.urlpath;
  });

  //
  // security
  if(!req.user.isAdmin()){
    //
    // TODO check req.body.items[i].fulfillment.quality
    // TODO security check req.body.items.vendor in shop
  }

  Orders.updateItem(req.params.oid, req.body, function(err,order){
    if(err){
      return res.status(400).send( (err));
    }

    //
    // admin only
    if(req.user.isAdmin()){
      return res.json(order)
    }


    var filtered=Orders.filterByShop([order],shop)
    return res.json(filtered[0])
  });
}

exports.updateShipping=function(req,res){

  // check && validate input 
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt();
    if(!req.body.status&&req.body.amount===undefined&&req.body.bags===undefined){
      throw new Error("La logistique ne peut pas être modifiée de cette manière");
    }
    validate.ifCheck(req.body.status, "Le status de logistique n'est pas valide").isBoolean();
    validate.ifCheck(req.body.bags, "Le nombre de sac n'est pas valide").isInt();
  }catch(err){
    return res.status(400).send( err.message);
  }


  Orders.updateLogistic({oid:req.params.oid}, req.body, function(err,orders){
    if(err){
      return res.status(400).send( (err));
    }
    return res.json(orders)
  });
}


exports.updateCollect=function(req,res){

  // check && validate input 
  try{
    validate.check(req.params.shopname, "Le vendeur n'est pas valide").len(2, 164).isSlug();    
    validate.check(req.body.when, "La date de livraison n'est pas valide").isDate()
    validate.check(req.body.status, "Le status de logistique n'est pas valide").isBoolean()
  }catch(err){
    return res.status(400).send( err.message);
  }



  Orders.updateLogistic({'vendors.slug':req.params.shopname}, req.body, function(err,orders){
    if(err){
      return res.status(400).send( (err));
    }
    return res.json(orders)
  });
}

//
// cancel order 
exports.cancel=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.status(400).send( err.message);
  }
  db.model('Orders').onCancel(req.params.oid,req.body.reason,function(err,order){
    if(err){
      return res.status(400).send( errorHelper(err.message||err));
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

    return res.json(order)
  })
}


//
// cancel order 
exports.refund=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.status(400).send( err.message);
  }

  db.model('Orders').onRefund(req.params.oid,req.body.amount,function(err,order){
    if(err){
      return res.status(400).send( errorHelper(err.message||err));
    }

    //
    // prepare and send mail
    var mail={
      order:order,
      created:order.getDateString(order.created),
      origin:req.header('Origin')||config.mail.origin,
      totalWithFees:order.getTotalPrice().toFixed(2),
      withHtml:true
    };
    bus.emit('sendmail',  
        order.email,
        'Remboursement de votre commande Karibou '+order.oid,
        mail,
        'order-refund',
        function(err,status){
          //TODO log activities
          if(err)console.log('---------------------------refund',order.oid,err)
        })

    return res.json(order)
  })
}


//
// capture current order with finalprice
exports.capture=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.status(400).send( err.message);
  }

  db.model('Orders').findOne({oid:req.params.oid}).select('+payment.transaction').exec(function(err,order){
    if(err){
      return res.status(400).send( errorHelper(err.message||err));
    }

    // items issue?
    if(!order){
      return res.json(400, "La commande "+req.params.oid+" n'existe pas.");
    }

    payment.for(order.payment.issuer).capture(order, req.body.reason)
      .then(function(order){

        //
        // prepare and send mail
        var subTotal=order.getSubTotal(),shippingFees=order.getShippingPrice();
        var mail={
          order:order,
          created:order.getDateString(order.created),
          shippingFees:shippingFees,
          paymentFees:payment.fees(order.payment.issuer,subTotal+shippingFees).toFixed(2),
          totalWithFees:order.getTotalPrice().toFixed(2),
          shippingWhen:order.getDateString(),
          subTotal:subTotal.toFixed(2),
          origin:req.header('Origin')||config.mail.origin,
          withHtml:true
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


        return res.json(_.extend({mail:mail},order.toObject()))
      })
      .fail(function(err){
        bus.emit('system.message',"[order-capture] :",{error:err.message,order:order.oid,customer:order.email});
        return res.status(400).send(err.message)        
      })


  })

}

//
// delete order 
exports.remove=function(req,res){
  try{
    validate.check(req.params.oid, "La commande n'est pas valide").isInt()
  }catch(err){
    return res.status(400).send( err.message);
  }

  return Orders.findOne({oid:req.params.oid}).exec(function(err,order){

    if(err){
      return res.status(400).send( errorHelper(err.message||err));
    }

    if(!order){
      return res.status(400).send("La commande n'existe pas")
    }

    // constraint the remove?
    //if(['voided','refunded'].indexOf(order.payment.status)===-1){
    //  return res.status(400).send("Impossible de supprimer une commande avec le status: "+order.payment.status))
    //}

    // delete
    order.remove(function(err){
      if(err)return res.json(400,errorHelper(err.message||err))
      return res.json({})
    });

  });
}


//
// TODO multiple implement of send email, refactor it?
exports.informShopToOrders=function(req,res){
  try{
    if(!req.body.when)throw new Error('La date est obligatoire')
    validate.ifCheck(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 100).isSlug();
    validate.check(new Date(req.body.when),"La date n'est pas valide").isDate()
    validate.ifCheck(req.body.content,"Le votre message n'est pas valide (entre 3 et 600 caractères)").len(0, 600).isText();
  }catch(err){
    return res.status(400).send( err.message);
  }



  var when=req.body.when,
      closed=req.body.closed,
      shop=req.params.shopname?[req.params.shopname]:[];

  if(!req.params.shopname){
    if(!req.user.isAdmin()){
      shop=_.collect(req.user.shops,function (shop) {
        return shop.urlpath;
      });
    }
  }


  //
  // get orders prepared for each shop mail
  Orders.prepareOrdersForMail(when,shop,closed,function (err,contents) {
    if(err){
      return res.status(400).send(errorHelper(err.message||err));
    }
    for(var s in contents){
      contents[s].origin=req.header('Origin')||config.mail.origin;

      //
      // a message can be append to the mail 
      contents[s].more=req.body.content||''
      contents[s].withHtml=true;

    }


    //
    // content is ready to be sent
    // BUT WE STILL NEEDS EMAILS
    var promises=[];
    db.model('Shops').find({urlpath:{$in:Object.keys(contents)}}).populate('owner')
      .exec(function(err,shops){  

      //
      // extract full shop details, list products and sent mail
      promises=shops.map(function (shop) {
        contents[shop.urlpath].shop=shop;
        var defer=Q.defer();
        
        //
        // TODO missing test for low stock products
        db.model('Products').findByCriteria({
          lowstock:true,
          available:true,
          shopname:shop.urlpath
        },function (err,products) {
          contents[shop.urlpath].products=products;

          bus.emit('sendmail',shop.owner.email.address,
               "Karibou - Confirmation de vos préparations pour le "+contents[shop.urlpath].shippingWhen,
                contents[shop.urlpath],"order-prepare",function (err,res) {
                  if(err){
                    console.log('DEBUG--------------',JSON.stringify(err,null,2))
                    return defer.reject(err);
                  }
                  defer.resolve(res);
                });          
        });

        return defer.promise;
      });




      //
      // waiting on results
      Q.all(promises).then(function (sentMails) {

        //
        // TODO parse content of sentMails to get rejected mails
        var rejected=[];
        sentMails.forEach(function (sent) {
          rejected=rejected.concat(sent.rejected);
        });
        rejected=_.uniq(rejected);
        if(rejected.length){
          return res.status(400).send("les mails suivant n'ont pas été envoyés :"+rejected.join(','));
        }
        // console.log('mail',sentMails)
        return res.json(contents);
      },function (err) {
        // TODO if only one msg got an error???
        return res.status(400).send(errorHelper(err.message||err));
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
    return res.status(400).send( err.message);
  }

  var criteria={}, result=[];

  // get the date
  criteria.from=new Date();
  if(req.params.year){
    criteria.from.setYear(parseInt(req.params.year))
  }

  // select a shipping month
  criteria.from.setDate(1)
  criteria.from.setMonth(parseInt(req.params.month)-1)
  criteria.from.setHours(1,0,0,0)

  criteria.to=new Date(criteria.from);
  criteria.to.setDate(criteria.from.daysInMonth())
  criteria.to.setHours(23,0,0,0)
  criteria.fulfillment='fulfilled'

  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return res.status(400).send(errorHelper(err.message||err));
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
      var subTotal=order.getSubTotal();
      var shippingFees=order.getShippingPrice();
      result.push({
        oid:order.oid,
        shipping:Orders.formatDate(order.shipping.when),
        customer:order.email,
        amount:subTotal.toFixed(2),
        shippingFees:shippingFees,
        paymentFees:payment.fees(order.payment.issuer,subTotal+shippingFees).toFixed(2),
        payment:order.payment.status,
        total:order.getTotalPrice().toFixed(2)
      })
      total+=parseFloat(order.getTotalPrice().toFixed(2));
      amount+=parseFloat(order.getSubTotal().toFixed(2));
      shipping+=shippingFees;
    })
    result.push(['','','',amount,shipping,'','',total])

    res.setHeader('Content-disposition', 'attachment; filename=invoices-users-'+criteria.from.getMonth()+''+criteria.from.getYear()+'.csv');
    res.csv(result)

  });
}

//
// get repport by shop
exports.invoicesByShops=function(req,res){
  try{
    if(!req.params.month)throw new Error('Le mois est obligatoire');
    if(req.params.year){}
  }catch(err){
    return res.status(400).send( err.message);
  }

  var criteria={}, result=[], showAll=req.query.all||false, output=req.query.output||'json';


  criteria.closed=true;
  criteria.fulfillment='fulfilled';

  parseCriteria(criteria,req)

  // get the date
  if(criteria.from &&!criteria.to){
    criteria.to=new Date(criteria.from);
    criteria.to.setDate(criteria.from.daysInMonth());
    criteria.to.setHours(23,0,0,0);
  }

  //
  // do not hide !fulfilled items
  if(req.query.all){
    criteria.showAll=true;
  }

  //
  // restrict to a shop name
  // 0) no shops given => you should be admin
  // 1) a list of shops is given => you should be admin
  // 2) user shops  => is the default
  if(req.user.isAdmin()){
    // admin can specify the shops
    if(req.query.shops){
      criteria.shop=req.query.shops
    }

  }else{
    // not admin and having almost one shop
    criteria.shop=req.user.shops.map(function(i){ return i.urlpath})      
  }

  Orders.generateRepportForShop(criteria,function(err,repport){
    if(err){
      return res.status(400).send(errorHelper(err.message||err));
    }
    res.json(repport)
  });

}

//
// get repport by shop
exports.invoicesByShops2=function(req,res){
  try{
    if(!req.params.month)throw new Error('Le mois est obligatoire');
    if(req.params.year){}
  }catch(err){
    return res.status(400).send( err.message);
  }

  var criteria={}, result=[], showAll=req.query.all||false, today=new Date(),output=req.query.output||'json';


  criteria.month=req.params.month;
  criteria.year=req.params.year||today.getFullYear();




  //
  // restrict to a shop name
  // 0) no shops given => you should be admin
  // 1) a list of shops is given => you should be admin
  // 2) user shops  => is the default
  if(req.user.isAdmin()){
    // admin can specify the shops
    if(req.query.shops){
      criteria.shop=req.query.shops
    }

  }else{
    // not admin and having almost one shop
    criteria.shop=req.user.shops.map(function(i){ return i.urlpath})      
  }

  Orders.getCAByYearMonthAndVendor(criteria,function(err,repport){
    if(err){
      return res.status(400).send(errorHelper(err.message||err));
    }
    res.json(repport[criteria.year][criteria.month])
  });

}

