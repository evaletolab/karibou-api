var util = require("util");
var bus = require('../app/bus');
var Q=require('q');

var PaymentInvoice=function(_super){
	this._super=_super;
}

//
// validate a card or alias and get result by callback
PaymentInvoice.prototype.card=function(payment, callback){
	return payment
}

//
// verify if an alias belongs to the user
PaymentInvoice.prototype.isValidAlias=function(alias, id, method){
	// no special check for now
  return true;
}

PaymentInvoice.prototype.alias=function(id,payment){
  return ((id+payment.issuer).hash().crypt());
}


//
// check if method fields are ok
PaymentInvoice.prototype.isPaymentObjectValid=function(payment){
	//TODO return (!payment||!payment.alias ||!payment.issuer){
  return (payment&&payment.issuer);
}

//
// authorize a new payment for this order
PaymentInvoice.prototype.authorize=function(order){
	var deferred = Q.defer();
	// only partial and reserved has status auth
	if(["reserved"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
  }

	if(["pending"].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.payment.status))
  }

  //
  // get authorisation, save status and transaction
  order.payment.status="authorized";

  //
  //order.payment.transaction="what we want to save"transaction.toJSON()"".crypt();
  order.save(function(err){
    if(err){
    	// never be there!!
      bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
		  return deferred.reject(err);
    }
    return deferred.resolve(order);
  })

	// return promise
	return deferred.promise;
}

//
// cancel  an authorization for this order
PaymentInvoice.prototype.cancel=function(order,reason){
	var deferred = Q.defer(),self=this;
	// only partial and reserved has status auth
	if(["reserved"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.fulfillments.status))
  }

  // only authorized can be cancelled
	if(['authorized'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.payment.status))
  }


  //if(!order.payment.transaction){
  //	return deferred.reject(new Error('Aucune transaction est attachée à votre commande'))
  //}

  // getting transaction
  order.fulfillments.status='failure';
  order.payment.status="voided";
  order.cancel={}
  order.cancel.reason=reason;
  order.cancel.when=new Date();
  order.closed=new Date();
  order.save(function(err){
    if(err){
    	// never be there!!
      bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
		  return deferred.reject(err);
    }
    return deferred.resolve(order);
  })

	// return promise
	return deferred.promise;
}

//
// refund this order
PaymentInvoice.prototype.refund=function(order,reason){
	var deferred = Q.defer(),self=this;


	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.fulfillments.status))
	}

	if(['paid','partially_paid'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.payment.status))
  }

  //if(!order.payment.transaction){
  //	return deferred.reject(new Error('Aucune transaction est attachée à votre commande'))
  //}

  order.fulfillments.status='failure';
  order.payment.status="refunded";
  order.cancel={};
  order.cancel.reason=reason;
  order.cancel.when=new Date();
  order.closed=new Date();
  order.save(function(err){
    if(err){
    	// never be there!!
      bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
		  return deferred.reject(err);
    }
    return deferred.resolve(order);
  })

	// return promise
	return deferred.promise;
}

//
// capture this authorized order
PaymentInvoice.prototype.capture=function(order,reason){
	var deferred = Q.defer(),self=this;

	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible de payer une commande en cours avec le status: "+order.fulfillments.status))
	}

	if(['authorized'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible de payer une commande avec le status: "+order.payment.status))
  }

  //if(!order.payment.transaction){
  //	return deferred.reject(new Error('Aucune transaction est attachée à votre commande'))
  //}


  order.payment.status="paid";
  order.closed=new Date();
  order.save(function(err){
    if(err){
    	// never be there!!
      bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
		  return deferred.reject(err);
    }
    return deferred.resolve(order);
  })

	// return promise
	return deferred.promise;
}


module.exports=function(_super){
	return new PaymentInvoice(_super)
};
