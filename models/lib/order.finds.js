var db = require('mongoose'),
    _=require('underscore'),
    debug = require('debug')('orders'),
    assert = require("assert");



//
// find open orders with financial status not paid
exports.findByTimeoutAndNotPaid = function(callback){
  var q={
    closed:null,
    "payment.status":{'$nin':['paid','authorized']},
    created:{"$lte": new Date().getTime()-config.shop.order.timeoutAndNotPaid*1000}
  }


  // console.log(q)
  var query=this.find(q).sort({created: -1});
  if (callback) return query.exec(callback);

  return query;
}



//
// find the last order for a shop
exports.findByCriteria = function(criteria, callback){
  assert(criteria);
  var Orders=this;
  
  var q={};

  // filter by OIDs
  if(criteria.oid){
      //
      // force integers
      var oids=criteria.oid.split(/[,+]/)
      oids.forEach(function(x,y,z){ z[y]=x|0 });
      q['oid']={$in:oids}
  }


  //
  // filter by shop or shops
  if(criteria.shop){
    if(Array.isArray(criteria.shop)){
      q["vendors.slug"]={"$in":criteria.shop};
    }else{
      q["$or"]=[{"items.vendor":criteria.shop},{"vendors.slug":criteria.shop}]
    }
  }


  //
  // filter by closed date
  if((criteria.closed === null || criteria.closed === undefined)&&
     !criteria.fulfillment&&
     !criteria.reason){
    q["closed"]={'$exists':false};
  }
  else if(criteria.closed === true){
    var sd=new Date('1980'),
        ed=new Date();
    //q["closed"]={"$gte": sd, "$lt": ed};
    q["closed"]={'$exists':true};
  }
  else if(criteria.closed ){
    criteria.closed=new Date(criteria.closed)
    var sd=new Date(criteria.closed.getFullYear(), criteria.closed.getUTCMonth(), criteria.closed.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["closed"]={"$gte": sd, "$lt": ed};
  }


  //
  // filter by next shipping date
  if(criteria.nextShippingDay){
    var next=this.findCurrentShippingDay();
    var sd=new Date(next.getFullYear(), next.getUTCMonth(), next.getUTCDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }
  //
  // filter by date (24h = today up to tonight)
  if(criteria.when){
    var sd=new Date(criteria.when.getFullYear(), criteria.when.getMonth(), criteria.when.getDate()),
        ed=new Date(sd.getTime()+86400000-60000);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }


  //
  // filter by free date
  if(criteria.from && criteria.to){
    if(criteria.padding===true){
      criteria.to=new Date(criteria.to.getTime()+7*86400000)
    }

    var sd=new Date(criteria.from.getFullYear(), criteria.from.getMonth(), criteria.from.getDate());
    //
    // do not remove the time limit of the ending date!
    var ed=new Date(criteria.to);
    q["shipping.when"]={"$gte": sd, "$lt": ed};
  }



  //
  // filter by user
  if(criteria.user){
    // q["email"]=criteria.user
    q["customer.id"]=parseInt(criteria.user);
    if(criteria.closed === null || criteria.closed === undefined){
      delete (q["closed"])   
    }
  }

  if(criteria.fulfillment){
    var multiple=criteria.fulfillment.split(',');
    q["fulfillments.status"]=(multiple.length>1)?{$in:multiple}:criteria.fulfillment;
  }

  if(criteria.reason){
    q["cancel.reason"]=criteria.reason;
  }

  //
  // filter by user
  if(criteria.payment){
    // q["email"]=criteria.user
    q["payment.status"]=criteria.payment;
  }
  debug("find criteria ",q)
  var query=Orders.find(q).sort({created: -1});

  //
  // FIXME get plain javascript object
  if(criteria.shop){
    query=query.lean()
  }
  if (callback)
    return query.exec(callback);
  return query;
}

