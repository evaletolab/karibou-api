var db = require('mongoose'),
    bus = require('../../app/bus'),
    _=require('underscore'),
    debug = require('debug')('orders'),
    assert = require("assert");


//
// find the last order for a shop
exports.coreCreate = function(criteria, callback){
  assert(criteria);
  var Orders=db.model('Orders');

  var q={};



  //
  // get unique Order identifier
  db.model('Sequences').nextOrder().then(function(oid){
    //
    // set oid
    order.oid=oid;

  });

};


exports.computeRankAndSave=function(cb){

  var self=this, sd=new Date(this.shipping.when), ed, promise, orderRank=1;
  sd.setHours(1,0,0,0)
  ed=new Date(sd.getTime()+86400000-3601000);

  db.model('Orders').find({"shipping.when":{"$gte": sd, "$lt": ed}}).exec(function(err,orders){
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

      callback(null,(orders.length==1)?orders[0]:orders)
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


    if(["reserved","partial"].indexOf(order.fulfillments.status)==-1){
      return callback("Impossible de modifier une commande avec le status: "+order.fulfillments.status);
    }


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
