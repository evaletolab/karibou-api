var util = require("util");
var events = require("events");
var bus = require('../app/bus');
var Q=require('q');


var PaymentTest=function(_super){
	this._super=_super;
}


//
// verify if an alias belongs to the user
PaymentTest.prototype.isValidAlias=function(alias, user, method){
  return ((user.id+'').hash().crypt()===alias);
}

//
// verify if an alias is valid and decode it
PaymentTest.prototype.decodeAlias=function(alias, user, method){
  try{
    if((user.id+'').hash().crypt()===alias){
      return {id:user.id,gateway_id:null,card_id:null}
    }
  }catch(e){}

  return false;
}

PaymentTest.prototype.alias=function(user_id,payment){
  return (user_id+'').hash().crypt();
}

//
// check if method fields are ok
PaymentTest.prototype.isPaymentObjectValid=function(payment){
  return (payment&&payment.alias&&payment.issuer&&payment.number);
}



//
// check stripe customer
PaymentTest.prototype.checkCard=function(user,alias){
	var deferred = Q.defer(), stripePromise, self=this, result={};



	//
	// check alias
	var handleStripe=this.decodeAlias(alias,user);
	if(!handleStripe){
    return Q.reject(new Error("Impossible de trouver une carte pour cet alias"))
	}

	var payment=user.getPaymentMethodByAlias(alias);
	if(!payment){
    return Q.reject(new Error("Cette carte n'est pas attachée à votre compte"))		
	}

	// return promise
	return Q.when(payment);

}


//
// validate a card or alias and get new Card by callback
PaymentTest.prototype.removeCard=function(user, alias){
	var self=this;
	var _removeCard=function (deferred, callback) {
		//
		// check alias
		var handleStripe=self.decodeAlias(alias,user);
		if(!handleStripe){
	    return Q.reject(new Error("Impossible de supprimer une carte pour cet alias"))
		}


		return Q.when(true)

	}
	return this._super.removeCard(_removeCard,user,alias)
}

//
// validate a card or alias and get new Card by callback
PaymentTest.prototype.addCard=function(user, payment){
	var stripePromise, self=this, result={};


	var _addCard=function (deferred, callback) {
  	result={
  		alias:self.alias(user.id,payment),
  		number:payment.number,
  		issuer:payment.issuer.toLowerCase(),
  		name:payment.name,
  		expiry:payment.expiry,
  		updated:Date.now(),
  		provider:'test'
  	};

    setTimeout(function() {
      callback(null,result);
    }, 0);
    return deferred.promise;
	}

	


	// return promise
	return this._super.addCard(_addCard,user,payment);
}


//
// authorize a new payment for this order
PaymentTest.prototype.authorize=function(order){
	var self=this;
  var _authorize=function (deferred, callback) {
		//
		// check alias
		var handleStripe=self.decodeAlias(order.payment.alias,order.customer);
		if(!handleStripe){
	    return Q.reject(new Error("Impossible d'autoriser une commande pour cet alias"))
		}

  	var result={
  		log:'authorized amount '+(Math.round(order.getTotalPrice(config.payment.reserve)))+' the '+new Date(),
  		transaction:order.oid,
  		updated:Date.now(),
  		provider:'test'
  	};

    setTimeout(function() {
      callback(null,result);
    }, 0);
		return deferred.promise;
	}	

	// return promise
	return this._super.authorize(_authorize, order);
}

//
// cancel  an authorization for this order
PaymentTest.prototype.cancel=function(order,reason){
	var self=this;
  var _cancel=function (deferred, callback) {
	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
	  }
	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

  	var result={
  		log:'cancel '+(Math.round(order.getTotalPrice(config.payment.reserve)))+' the '+new Date(),
  		transaction:order.oid,
  		updated:Date.now(),
  		provider:'test'
  	};

    setTimeout(function() {
      callback(null,result);
    }, 0);
		return deferred.promise;
  }

	// return promise
	return this._super.cancel(_cancel,order,reason)
}

//
// refund this order
PaymentTest.prototype.refund=function(order,reason, amount){
	var self=this;
  //
  // create full refund 
	var _refund=function (deferred, callback) {
	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
	  }

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  var refund=amount||(Math.round(order.getTotalPrice(config.payment.reserve)))
  	var result={
  		log:'refund '+refund+' the '+new Date(),
  		transaction:order.oid,
  		updated:Date.now(),
  		provider:'test'
  	};
    setTimeout(function() {
      callback(null,result);
    }, 0);
		return deferred.promise;
	}

	return this._super.refund(_refund,order,reason,amount)

}

//
// capture this authorized order
PaymentTest.prototype.capture=function(order,reason){
	var self=this;
	var _capture=function (deferred, callback) {
	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
	  }

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  var amount=order.getTotalPrice()
  	var result={
  		log:'capture '+amount+' the '+new Date(),
  		transaction:order.oid,
  		updated:Date.now(),
  		provider:'test'
  	};

    setTimeout(function() {
      callback(null,result);
    }, 0);
		return deferred.promise;
	}

	return this._super.capture(_capture,order,reason)

}


module.exports=function(_super){
	return new PaymentTest(_super)
};
