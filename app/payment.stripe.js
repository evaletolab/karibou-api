var util = require("util");
var events = require("events");
var bus = require('../app/bus');
var Q=require('q');
var stripe = require("stripe")(config.payment.stripe.key);

//config.payment.stripe.key
var settings={};

function parseError(err, from) {
	var errorMessages = {
	  incorrect_number: "Le numéro de carte est incorrect.",
	  invalid_number: "Le numéro de carte n'est pas compatible avec le format 'credit card'.",
	  invalid_expiry_month: "Le mois d'expiration de votre carte n'est plus valide.",
	  invalid_expiry_year: "L'année d'expiration de votre carte n'est plus valide.",
	  invalid_cvc: "Le code de sécurité de votre carte (CVC) est invalide.",
	  expired_card: "Votre carte a expirée.",
	  incorrect_cvc: "The card's security code is incorrect.",
	  incorrect_zip: "The card's zip code failed validation.",
	  card_declined: "The card was declined.",
	  missing: "There is no card on a customer that is being charged.",
	  processing_error: "An error occurred while processing the card.",
	  rate_limit:  "An error occurred due to requests hitting the API too quickly. Please let us know if you're consistently running into this error."
	};

	//
	// get an email on error
	var context=(from.oid)?('order.oid:'+from.oid):((from.id)?('user.id:'+from.id):from)
  bus.emit('system.message',"[karibou-danger] stripe error: ",{message:err.message,type:err.type, param:err.param,code:err.code, context:context});

	switch (err.type) {
	  case 'StripeCardError':
	    // A declined card error
	    return new Error(errorMessages[ err.code ]||err.message)
	  case 'StripeInvalidRequestError':
	    // Invalid parameters were supplied to Stripe's API
	    break;
	  case 'StripeAPIError':
	    // An error occurred internally with Stripe's API
	    break;
	  case 'StripeConnectionError':
	    // Some kind of error occurred during the HTTPS communication
	    break;
	  case 'StripeAuthenticationError':
	    // You probably used an incorrect API key
	    break;
	}	
	return err
}


var PaymentStripe=function(_super){
	this.stripe=stripe;
	this._super=_super;
}


//
// verify if an alias is valid and belongs to the user
PaymentStripe.prototype.isValidAlias=function(alias, user){
	try{
		var elems=alias.decrypt().split(':')
		return(elems.length===3 && elems[0]===user.id+'')
	}catch(e){
		return false;
	}
  // return ((id).crypt()===alias);
}

//
// verify if an alias is valid and decode it
PaymentStripe.prototype.decodeAlias=function(alias, user){
	try{
		var elems=alias.decrypt().split(':')
		if(elems[0]!==(user.id+'')) return false;
		return {id:elems[0],gateway_id:elems[1],card_id:elems[2]}
	}catch(e){
		return false;
	}
}

//
// check if method fields are ok
PaymentStripe.prototype.isPaymentObjectValid=function(payment){
  return (payment&&payment.alias&&payment.issuer&&payment.number);
}

PaymentStripe.prototype.alias=function(user_id,customer_id,card_id){
	//
	// with stripe the customer id is enought 
  // return (id).crypt();
  // "uid:cus_4x7DlGKcSHEXhr:card_15VmyrBTMLb4og7PsZWQDTTe"
  return (user_id+':'+customer_id+':'+card_id).crypt()  
}




//
// check stripe customer
PaymentStripe.prototype.checkCard=function(user,alias){
	var deferred = Q.defer(), stripePromise, self=this, result={};


	//
	// check alias
	var handleStripe=this.decodeAlias(alias,user);
	if(!handleStripe){
    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"))
	}

	if(handleStripe.gateway_id!==user.gateway_id){
    return Q.reject(new Error("Cette carte n'est pas attachée à votre compte"))		
	}
	//
	// check customer binding
	// stripe.customers.retrieve(user.gateway_id, function(err, customer) {
	// 	if(err){
	// 		user.gateway_id=null;
	// 		user.save()
	// 	}
	// });	

	//
	// check card binding
	stripe.customers.retrieveCard(
		handleStripe.gateway_id, 
		handleStripe.card_id,
	  function(err, card) {
	    if(err){
	    	return deferred.reject(parseError(err,user));
	    }
	    deferred.resolve(card);
	  }
	);

	// return promise
	return deferred.promise;

}


//
// validate a card or alias and get new Card by callback
PaymentStripe.prototype.removeCard=function(user, alias){
	var self=this;
	var _removeCard=function (deferred, callback) {
		//
		// check alias
		var handleStripe=self.decodeAlias(alias,user);
		if(!handleStripe){
	    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"))
		}

		//
		// check customer id
		if(!user.gateway_id){
	    bus.emit('system.message',"[karibou-danger] deleting payment gateway_id error: ",{error:'gateway_id not found',user:user.email.address, alias:alias.decrypt()});
	    return Q.when({id:1});		
	    // return Q.reject(new Error("Impossible de supprimer une carte pour cet utilisateur"))
		}

		stripe.customers.deleteCard(
			handleStripe.gateway_id, 
			handleStripe.card_id,
		function (err, confirmation) {
	    if(err)return deferred.reject(parseError(err,user));
	    deferred.resolve(confirmation);
			// callback(parseError(err),confirmation)
		})

		// return promise
		return deferred.promise;

	}

	return this._super.removeCard(_removeCard,user,alias)
}

//
// validate a card or alias and get new Card by callback
PaymentStripe.prototype.addCard=function(user, payment){
	var stripePromise, self=this, result={};


	var _addCard=function (deferred, callback) {

		if(!payment.id){
	    return Q.reject(new Error("Impossible d'enregistrer une carte sans (id:stripe)"))
		}

		//
		// check customer id
		if(user.gateway_id){
			stripePromise=Q.when({id:user.gateway_id})
			// stripePromise=Q.fcall(function () {
			// 	return {id:user.gateway_id};
			// })

		}else{
			//
			// create customer id
			stripePromise=stripe.customers.create({
				email:user.email.address,
			  description: user.display()+' id:'+user.id
			});
		}

		//
		// create card
		stripePromise.then(function (customer) {
		  stripe.customers.createCard(
		    customer.id, {card: payment.id}, //"tok_25UMttBTMLb4og7PRQfVQ9RH"
		    function(err, card) {
		    	if(err){
				    return deferred.reject(parseError(err,user));
		    		// return callback(parseError(err))
		    	}
		    	// save customer id
		    	user.gateway_id=customer.id;
		    	result={
		    		alias:self.alias(user.id,customer.id,card.id),  //"uid:cus_4x7DlGKcSHEXhr:card_15VmyrBTMLb4og7PsZWQDTTe"
		    		number:'xxxx-xxxx-xxxx-'+card.last4,
		    		issuer:card.brand.toLowerCase(),
		    		name:card.name,
		    		expiry:card.exp_month+'/'+card.exp_year,
		    		updated:Date.now(),
		    		provider:'stripe'
		    	};
		    	// return callback(null,result)
			    return deferred.resolve(result, customer.id);
		    }
		  );
		},function (error) {
	    deferred.reject(parseError(error));
			// return callback(parseError(error))
		})
		return deferred.promise;
	}

	


	// return promise
	return this._super.addCard(_addCard, user,payment);
}


//
// authorize a new payment for this order
PaymentStripe.prototype.authorize=function(order){
	var self=this;
  var _authorize=function (deferred, callback) {
		//
		// check alias
		var handleStripe=self.decodeAlias(order.payment.alias,order.customer);
		if(!handleStripe){
	    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"))
		}

		stripe.charges.create({
		  amount: Math.round(order.getTotalPrice(config.payment.reserve)*100),
		  currency: "CHF",
		  customer:handleStripe.gateway_id,
		  card: handleStripe.card_id, 
		  capture:false, /// ULTRA IMPORTANT HERE!
		  description: "#"+order.oid+" for "+order.customer.email.address
		}, function(err, charge) {
			if(err){ return callback(parseError(err,order))}

	  	var result={
	  		log:'authorized amount '+(charge.amount/100)+' the '+new Date(charge.created),
	  		transaction:charge.id.crypt(),
	  		updated:Date.now(),
	  		provider:'stripe'
	  	};

			callback(null,result)
		});	  

		// return a promise
		return deferred.promise;
	}	

	// return promise
	return this._super.authorize(_authorize, order);
}

//
// cancel  an authorization for this order
PaymentStripe.prototype.cancel=function(order,reason){
	var self=this;
  var _cancel=function (deferred, callback) {

	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
	  }

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

		stripe.charges.createRefund(
			order.payment.transaction.decrypt(),{},
		function(err, refund) {
			if(err){ return callback(parseError(err,order))}
	  	var result={
	  		log:'cancel authorization the '+new Date(refund.created),
	  		transaction:refund.id.crypt(),
	  		updated:Date.now(),
	  		provider:'stripe'
	  	};
			callback(null,result)
		});

		return deferred.promise;
  }

	// return promise
	return this._super.cancel(_cancel,order,reason)
}

//
// refund this order
PaymentStripe.prototype.refund=function(order,reason, amount){
	var self=this;
  //
  // create full refund 
	var _refund=function (deferred, callback) {
	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
	  }

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  var params={}
	  if(amount){params.amount=amount*100}
		stripe.charges.createRefund(
			order.payment.transaction.decrypt(),
			params,
		function(err, refund) {
			if(err){ return callback(parseError(err,order))}
			// align data here
	  	var result={
	  		log:'refund '+refund.amount/100+' the '+new Date(refund.created),
	  		transaction:refund.id.crypt(),
	  		updated:Date.now(),
	  		provider:'stripe'
	  	};
			callback(null,result)
	  });

		return deferred.promise;
	}

	return this._super.refund(_refund,order,reason,amount)

}

//
// capture this authorized order
PaymentStripe.prototype.capture=function(order,reason){
	var self=this;
	var _capture=function (deferred, callback) {

	  if(!self.isValidAlias(order.payment.alias, order.customer)){
	    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
	  }

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

		stripe.charges.capture(
			order.payment.transaction.decrypt(),
			{amount:order.getTotalPrice()*100},
		function(err, charge) {
			if(err){ return callback(parseError(err,order))}
	  	var result={
	  		log:'capture '+charge.amount/100+' the '+new Date(charge.created),
	  		transaction:charge.id.crypt(),
	  		updated:Date.now(),
	  		provider:'stripe'
	  	};
			callback(null,result)
		});	  

		return deferred.promise;
	}

	return this._super.capture(_capture,order,reason)

}


module.exports=function(_super){
	return new PaymentStripe(_super)
};
