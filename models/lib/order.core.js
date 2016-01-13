var db = require('mongoose'),
    bus = require('../../app/bus'),
    _=require('underscore'),
    payment = require('../../app/payment'),
    Promise = db.Promise,
    debug = require('debug')('orders'),
    assert = require("assert");


//
// validate params for new orders 
exports.validateParams=function (items, customer, shipping, paymentData, callback) {
  assert(items);
  assert(customer);
  assert(shipping);
  var now =new Date()
    , Orders=this.model('Orders')
    , order={};

  var promise = new Promise;
  if(callback){promise.addBack(callback);}


  // remove min/sec to compute the timeleft for shipping
  now.setHours(now.getHours(),0,0,0)

  //
  // simple items check
  if(!items.length){
    return promise.reject(new Error("Vous ne pouvez pas passer une commande avec un panier vide."));
  }

  //
  // check shipping maintenance
  if(config.shop.maintenance.active){
    return promise.reject(new Error("Les livraisons ne sont pas possibles pour l'instant"));  
  }

  //
  // check the shipping day
  if(!shipping.when){
    return promise.reject(new Error("La date de livraison est obligatoire"));
  }
  // be sure that is a Date object
  shipping.when=new Date(shipping.when)


  if(config.shop.noshipping&&config.shop.noshipping.length){
    for (var i = config.shop.noshipping.length - 1; i >= 0; i--) {
      var noshipping=config.shop.noshipping[i];
      var from = new Date(noshipping.from);
      var to=new Date(noshipping.to);
      var msg="Les livraisons sont interrompues jusqu'au "+Orders.formatDate(to);
      from.setHours(1,0,0,0);
      to.setHours(1,0,0,0);
      if((shipping.when>=from && shipping.when<to)){
        return promise.reject(new Error(noshipping.reason||msg));
      }

    };
  }


  //
  // check that shipping day is available on: config.shop.order.weekdays
  if (config.shop.order.weekdays.indexOf(shipping.when.getDay())==-1){
    return promise.reject(new Error("La date de livraison n'est pas valable"));
  }

  var when=new Date(shipping.when).setHours(config.shop.order.timelimitH,0,0,0)
  if(Math.abs((when-now.getTime())/3600000) < config.shop.order.timelimit){
    return promise.reject(new Error("Cette date de livraison n'est plus disponible."));
  }

  // if shipping time is defined (important for differents timezone)
  if(shipping.hours){
    shipping.when.setHours(shipping.hours,0,0,0)    
  }

  //
  // check time for delivery
  var times=Object.keys(config.shop.order.shippingtimes)
  if(times.indexOf(String(shipping.when.getHours()))==-1){
    return promise.reject(new Error("L'heure de livraison n'est pas valable"));
  }


  // early test
  // make sure that payment issuer belongs to this customer
  try{

    if(!paymentData||!customer.id ||!payment.for(paymentData.issuer).isPaymentObjectValid(paymentData)){
      return promise.reject(new Error("Votre commande est incomplète, l'ordre ne peut pas êtree passé"));
    } 

    if(!payment.for(paymentData.issuer).isValidAlias(paymentData.alias,customer, paymentData.issuer)){
      return promise.reject(new Error("Votre méthode de paiement est invalide, l'ordre ne peut pas être passé"));
    }

  }catch(error){
    return promise.reject(new Error(error.message));   
  }


  //
  // checking customer data
  if(!customer.email||customer.email.status!==true){
    return promise.reject(new Error('valid email is required.'));
  }

  //
  // checking shipping data
  if (!shipping ||Object.keys(shipping).length<3
                ||!shipping.name
                ||!shipping.streetAdress
                ||!shipping.floor
                ||!shipping.postalCode
                ||!shipping.region){
    return promise.reject(new Error('shipping address is missing or imcomplet.'));
  }

  return promise.resolve();
}


//
// find the last order for a shop
exports.coreCreate = function(oid,items,customer,shipping,paymentData, vendors,callback){
  assert(items);
  assert(customer);
  assert(shipping);
  assert(paymentData);
  assert(vendors);

  var Orders=this.model('Orders'), order={};

  var promise = new Promise;
  if(callback){promise.addBack(callback);}

  debug('create order %s for %s on %s with %d items',oid,shipping.name,shipping.when,items.length);

  //
  // set oid
  order.oid=oid;


  //
  // adding customer info and email (check validity)
  order.customer={
    id:customer.id,
    merchant:customer.merchant,
    displayName:customer.displayName,
    created:customer.created,
    status:customer.status,
    addresses:customer.addresses,
    phoneNumbers:customer.phoneNumbers,
    name:customer.name,
    email:customer.email
  }
  order.email=customer.email.address;

  //
  // adding shipping address (minimum 3 fields
  // for general error msg)
  order.shipping={
    name:shipping.name,
    note:shipping.note,
    streetAdress:shipping.streetAdress,
    floor:shipping.floor,
    postalCode:shipping.postalCode,
    region:shipping.region,
    geo:shipping.geo,
    when:shipping.when
  };

  //
  // adding paymentData
  order.payment={
    alias:paymentData.alias,
    number:paymentData.number,
    issuer:paymentData.issuer,
    fees:{shipping:null}
  };

  //
  // attach vendors and items
  order.vendors=vendors;
  order.items=items;

  //
  // save the payment expiry 
  // TODO throw error if no payment is available
  if(customer.payments&&customer.payments.length){
    var payment=_.find(customer.payments,function (p) {
      return(p.alias===paymentData.alias)
    })
    if(!payment){
      return promise.reject(new Error('Olala, nous n\'avons pas trouver le mode de paiement que vous avez sélectionné. Veuillez recharger la page merci!'));
    }
    
    order.payment.expiry=payment.expiry;
  }


  //
  // ready to create one order
  var dborder =new Orders(order);

  dborder.payment.fees.shipping=dborder.getShippingPrice();

  //
  // update rank for this valid order
  dborder.computeRankAndSave(function (err,order) {
    if(err){
      return promise.reject(err)
    }
    promise.resolve(null,order);
  });

  //
  // 
  return promise;
};


exports.computeRankAndSave=function(cb){

  var self=this, sd=new Date(this.shipping.when), ed, promise, orderRank=1;
  sd.setHours(1,0,0,0)
  ed=new Date(sd.getTime()+86400000-3601000);

  this.model('Orders').find({"shipping.when":{"$gte": sd, "$lt": ed}}).exec(function(err,orders){
    var newRank=0;
    for (var i = orders.length - 1; i >= 0; i--) {
      newRank=Math.max(newRank,orders[i].rank);
    };
    self.rank=newRank+1;
    debug("computeRankAndSave query:shipping.when",sd, ':',ed,'==',self.rank)
    self.save(cb)
  })
};


//
// only finalprice and note can be modified for an item
// status == reserver,partial ,  payment==authorized
exports.updateLogistic = function(query,options, callback){
  assert(query);
  assert(options);
  var saveTasks=[], Q=require('q');

  if(options.status === undefined && options.bags===undefined){
    return callback("updateLogistic missing shipping param");          
  }



  //
  // select orders by date
  if(query['vendors.slug']){
    var when=Date.parse(options.when);
    if(!when||when==NaN){
      return callback("updateLogistic missing date ");                
    }
    // date is ok
    when=new Date(when)

    var sd=new Date(when.getFullYear(), when.getUTCMonth(), when.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    query["shipping.when"]={"$gte": sd, "$lt": ed};

    //
    // in this case do not find closed order!
    query["closed"]={'$exists':false};

  //
  // select order by OID
  }else if(!query.oid){
    return callback('updateLogistic missing order selector ')
  }

  this.find(query,function(err,orders){
    if(err){
      return callback(err)
    } 

    if(!orders.length){
      if(query.oid) return callback("Impossible de trouver la commande: "+query.oid);
      return callback("Impossible de trouver une commande pour la boutique: "+query['vendors.slug']);
    }

    for (var i=0; i < orders.length; i++) {
      //
      // fill an array of promises
      saveTasks.push((function(order) {
        var deferred = Q.defer();

        var statusShopper=(options.status === "true"||options.status === true);

        //
        // check order status
        // if(order.closed&&statusShopper){
        //   return Q.reject(("Impossible de livrer une commande fermée: "+order.oid))
        // }

        // cancelreason:["customer", "fraud", "inventory", "other"],
        if(order.cancel&&order.cancel.when){
          return Q.reject(("Impossible de livrer une commande annulée: "+order.oid))
        }
        //["pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"]
        if(["authorized","invoice","paid"].indexOf(order.payment.status)==-1){
          return Q.reject(("Impossible de livrer une commande sans validation financière : "+order.payment.status));
        }




        //
        // vendor is collected?
        if(query['vendors.slug']){
          for (var i = order.vendors.length - 1; i >= 0; i--) {
            if(order.vendors[i].slug===query['vendors.slug']){
              order.vendors[i].collected=statusShopper;
              break;
            }
          };
        }
        // customer is shipped
        else{
          if(["fulfilled"].indexOf(order.fulfillments.status)==-1){
            return Q.reject(("Impossible de livrer une commande avec le status: "+order.fulfillments.status));
          }
          if(options.bags!==undefined)order.shipping.bags=options.bags;
          if(options.status!==undefined)order.shipping.shipped=statusShopper;
        }

        // return order.save()
        order.save(function (err,order) {
          if(err){return deferred.reject(err);}
          deferred.resolve(order)
        })
        return deferred.promise;
      })(orders[i]));
    }
    //
    // notify this order has been successfully modified
    bus.emit('order.update.logistic',null,orders,options)

    return Q.all(saveTasks).then(function(){

      callback(null,(!options.when)?orders[0]:orders)
    },function(err) {
      callback(err)
    })



  });
}



//
// only finalprice and note can be modified for an item
// status == reserver,partial ,  payment==authorized
exports.updateItem = function(oid,items, callback){
  assert(oid);
  assert(items);
  db.model('Orders').findOne({oid:oid},function(err,order){
    if(err){
      return callback(err)
    }
    if(!order){
      return callback("Impossible de trouver la commande: "+oid);
    }

    //
    // check order status
    if(order.closed){
      return callback("Impossible de modifier une commande fermée: "+oid);
    }

    // cancelreason:["customer", "fraud", "inventory", "other"],
    if(order.cancel&&order.cancel.when){
      return callback("Impossible de modifier une commande annulée: "+oid);
    }
    //["pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"]
    if(["authorized"].indexOf(order.payment.status)==-1){
      return callback("Impossible de modifier une commande sans validation financière : "+order.payment.status);
    }


    // THIS IS WRONG! 
    // if(["reserved","partial"].indexOf(order.fulfillments.status)==-1){
    //   return callback("Impossible de modifier une commande avec le status: "+order.fulfillments.status);
    // }


    var itemIds=[], rollback=[];
    items.forEach(function(item){
      assert(item.sku)
      for(var i in order.items){
        if(order.equalItem(order.items[i],item)){
        // if(order.items[i].sku===item.sku){
          if(item.finalprice) order.items[i].finalprice=item.finalprice;
          if(item.note)       order.items[i].note=item.note;
          if(item.fulfillment)order.items[i].fulfillment.status=item.fulfillment.status;

          //
          // take care of variant
          if(item.variant)       order.items[i].variant=item.variant;

          // this item has bean removed from the order
          if(item.fulfillment.status==='failure'){
            rollback.push({sku:item.sku,qty:item.quantity})
            //order.items[i].finalprice=item.finalprice=0.0;
          }
          itemIds.push(order.items[i].sku);
          break;
        }
      }
    })

    // console.log('-----------> items:',_.collect(items,function(i){return i.sku}))
    // console.log('-----------> order.items:',_.collect(order.items,function(i){return i.sku}))
    // console.log('-----------> fulfillment:',_.collect(order.items,function(i){return i.fulfillment.status}))


    if(itemIds.length!==items.length){
      var itemIds=items.filter(function(e){
          return (itemIds.indexOf(e.sku)===-1);
      })

      return callback("L'action est annulée, les articles suivants ne concernent pas cette commande : "+itemIds.map(function(i){return i.sku}).join(', '));
    }

    //
    // notify this order has been successfully modified
    bus.emit('order.update.items',null,order,items)

    // if the order is not fulfilled
    order.fulfillments.status='fulfilled'
    order.items.forEach(function(item){
      if(['failure','fulfilled'].indexOf(item.fulfillment.status)===-1){
        order.fulfillments.status='partial'
      }
    })

    order.save(callback);
  });
}
