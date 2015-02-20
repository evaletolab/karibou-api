var util = require("util");
var events = require("events");
var bus = require('../app/bus');
var Q=require('q');
var stripe = require("stripe")(config.payment.stripe.key);

//config.payment.stripe.key
var settings={};

function parseError(err) {
	var errorMessages = {
	  incorrect_number: "Le numéro de carte est incorrect.",
	  invalid_number: "The card number is not a valid credit card number.",
	  invalid_expiry_month: "The card's expiration month is invalid.",
	  invalid_expiry_year: "The card's expiration year is invalid.",
	  invalid_cvc: "The card's security code is invalid.",
	  expired_card: "The card has expired.",
	  incorrect_cvc: "The card's security code is incorrect.",
	  incorrect_zip: "The card's zip code failed validation.",
	  card_declined: "The card was declined.",
	  missing: "There is no card on a customer that is being charged.",
	  processing_error: "An error occurred while processing the card.",
	  rate_limit:  "An error occurred due to requests hitting the API too quickly. Please let us know if you're consistently running into this error."
	};

	//
	// get an email on error
  bus.emit('system.message',"[karibou-danger] stripe error: ",{error:err.message,type:err.type, param:err.param,code:err.code});

	switch (err.type) {
	  case 'StripeCardError':
	    // A declined card error
	    return errorMessages[ err.code ]
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
	return err.message
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
    return Q.reject(new Error("Impossible de trouver une carte pour cet alias"))
	}

	if(handleStripe.gateway_id!==user.gateway_id){
    return Q.reject(new Error("Cette carte n'est plus attachée à notre système"))		
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
	    	return deferred.reject(parseError(err));
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
	var deferred = Q.defer(), self=this;

	if(user.email.status!==true){
    return Q.reject(new Error("Votre email doit être validé pour supprimer une méthode de paiement"))
	}

	if(!user.status){
    return Q.reject(new Error("Votre est désactivé"))
	}

	//
	// check alias
	var handleStripe=this.decodeAlias(alias,user);
	if(!handleStripe){
    return Q.reject(new Error("Impossible de supprimer une carte pour cet alias"))
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
    if(err)return deferred.reject(parseError(err));
    deferred.resolve(confirmation);
		// callback(err,confirmation)
	})

	// return promise
	return deferred.promise;
}

//
// validate a card or alias and get new Card by callback
PaymentStripe.prototype.addCard=function(user, payment){
	var deferred = Q.defer(), stripePromise, self=this, result={};

	if(user.email.status!==true){
    return Q.reject(new Error("Votre email doit être validé pour ajouter une méthode de paiement"))
	}

	if(!user.status){
    return Q.reject(new Error("Votre compte est désactivé"))
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
			    return deferred.reject(parseError(err));
	    		// return callback(err)
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
	    	// return callback(err,result)
		    return deferred.resolve(result, customer.id);
	    }
	  );
	},function (error) {
    deferred.reject(parseError(error));
		// return callback(error)
	})


	// return promise
	return deferred.promise;
}


//
// authorize a new payment for this order
PaymentStripe.prototype.authorize=function(order){
	var deferred = Q.defer();

	// only partial and reserved has status auth
	if(["reserved"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
  }

	if(["pending"].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
  }

	//
	// check alias
	var handleStripe=this.decodeAlias(order.payment.alias,order.customer);
	if(!handleStripe){
    return Q.reject(new Error("Impossible d'autoriser une commande pour cet alias"))
	}

	stripe.charges.create({
	  amount: Math.round(order.getTotalPrice(config.payment.reserve)*100),
	  currency: "CHF",
	  customer:handleStripe.gateway_id,
	  card: handleStripe.card_id, 
	  capture:false, /// ULTRA IMPORTANT HERE!
	  description: "#"+order.oid+" for "+order.customer.email.address
	}, function(err, charge) {
	  if(err){
		  return order.rollbackProductQuantityAndSave("system",function(e){
		    deferred.reject(parseError(err));
		  })		  				  
	  }
	  //
	  // get authorisation, save status and transaction
	  order.payment.logs=['authorized amount '+(charge.amount/100)+' the '+new Date(charge.created)]
	  order.payment.status="authorized";
	  order.payment.transaction=charge.id.crypt();
	  order.save(function(err){
	    if(err){
	    	// never be there!!
	    	// it's not possible to get gateway authorization and an issue to save it in our local storage 
        bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
			  return deferred.reject(err);
	    }
	    return deferred.resolve(order);
	  })

	});	  

	// return promise
	return deferred.promise;
}

//
// cancel  an authorization for this order
PaymentStripe.prototype.cancel=function(order,reason){
	var deferred = Q.defer(),self=this;

	// only reserved can be cancelled 
	// (partial mean that almost one item is fulfilled and must be payd)
	if(["reserved"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.fulfillments.status))
  }

  // only authorized can be cancelled
	if(['authorized'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.payment.status))
  }

  if(!this.isValidAlias(order.payment.alias, order.customer)){
  	console.log('DEBUG ',order.payment.alias)
    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
  }

  if(!order.payment.transaction){
  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
  }

	stripe.charges.createRefund(
		order.payment.transaction.decrypt(),{},
	function(err, refund) {
  	if(err){
  		return deferred.reject(parseError(err));		
  	}
  	if(!order.payment.logs)order.payment.logs=[]
	  order.fulfillments.status='failure';
  	order.payment.logs.push('cancel '+refund.amount/100+' the '+new Date(refund.created))
    order.payment.status="voided";
    order.payment.transaction=JSON.stringify(refund)
    order.cancel={}
    order.cancel.reason=reason;
    order.cancel.when=new Date();
    order.closed=new Date();
    return order.save(function(err){
	    if(err){
	    	// never be there!!
        bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
			  return deferred.reject(err);
	    }
	    return deferred.resolve(order);
    })
  });

	// return promise
	return deferred.promise;
}

//
// refund this order
PaymentStripe.prototype.refund=function(order,reason, amount){
	var deferred = Q.defer(),self=this;

	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.fulfillments.status))
	}

	if(['paid','partially_paid'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.payment.status))
  }

  if(!this.isValidAlias(order.payment.alias, order.customer)){
  	console.log('DEBUG ',order.payment.alias)
    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
  }

  if(!order.payment.transaction){
  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
  }

  //
  // create full refund 
  var params={}
  if(amount){params.amount=amount*100}
	stripe.charges.createRefund(order.payment.transaction.decrypt(),params,function(err, refund) {
  	if(err){
  		return deferred.reject(parseError(err));		
  	}

	  order.fulfillments.status='failure';
  	order.payment.logs.push('refund '+refund.amount/100+' the '+new Date(refund.created))
    order.payment.transaction=JSON.stringify(refund)
    order.payment.status="refunded";
    order.cancel={}
    order.cancel.reason=reason;
    order.cancel.when=new Date();
    order.closed=new Date();
    return order.save(function(err){
	    if(err){
	    	// never be there!!
        bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
			  return deferred.reject(err);
	    }
	    return deferred.resolve(order);
    })
  });

	// return promise
	return deferred.promise;
}

//
// capture this authorized order
PaymentStripe.prototype.capture=function(order,reason){
	var deferred = Q.defer(),self=this;

	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
    return Q.reject(new Error("Impossible de payer une commande en cours avec le status: "+order.fulfillments.status))
	}

	if(['authorized'].indexOf(order.payment.status)===-1){
    return Q.reject(new Error("Impossible de payer une commande avec le status: "+order.payment.status))
  }

  if(!this.isValidAlias(order.payment.alias, order.customer)){
  	console.log('DEBUG ',order.payment.alias)
    return Q.reject(new Error('Votre méthode de paiement est invalide (stripe)'));
  }

  if(!order.payment.transaction){
  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
  }

	stripe.charges.capture(
		order.payment.transaction.decrypt(),
		{amount:order.getTotalPrice()*100},
	function(err, charge) {
  	if(err){
  		return deferred.reject(parseError(err));		
  	}
  	order.payment.logs.push('paid '+charge.amount/100+' the '+new Date(charge.created))
    order.payment.status="paid";
    order.closed=new Date();
    return order.save(function(err){
	    if(err){
	    	// never be there!!
        bus.emit('system.message',"[order-danger] save:",{error:err.message,order:order.oid,customer:order.email});
			  return deferred.reject(err);
	    }
	    return deferred.resolve(order);
    })
	});	  


	// return promise
	return deferred.promise;
}


module.exports=function(_super){
	return new PaymentStripe(_super)
};
