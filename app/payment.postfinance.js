var util = require("util");
var events = require("events");
var bus = require('../app/bus');
var Q=require('q');
var postfinance =require('node-postfinance');
var settings={};

settings.allowMultipleSetOption = false;
settings.sandbox = config.payment.postfinance.sandbox||true; 
settings.enabled = config.payment.postfinance.enabled||false; 
settings.debug = config.payment.postfinance.debug||false; 
settings.pspid = config.payment.postfinance.pspid;
settings.apiUser=config.payment.postfinance.apiUser;
settings.apiPassword = config.payment.postfinance.apiPassword;
settings.shaSecret = config.payment.postfinance.shaSecret;


postfinance.configure(settings);

var PaymentPostfinance=function(_super){
	this.postfinance=postfinance;
	this._super=_super;
}


//
// verify if an alias belongs to the user
PaymentPostfinance.prototype.isValidAlias=function(alias, user, method){
  return ((user.id+method.toLowerCase()).hash().crypt()===alias);
}

//
// verify if an alias is valid and decode it
PaymentPostfinance.prototype.decodeAlias=function(alias, user, method){
  try{
    if((user.id+method.toLowerCase()).hash().crypt()===alias){
      return {id:user.id,gateway_id:null,card_id:null}
    }
  }catch(e){}
  
  return false;
}


//
// check if method fields are ok
PaymentPostfinance.prototype.isPaymentObjectValid=function(payment){
  return (payment&&payment.alias&&payment.issuer&&payment.number);
}

PaymentPostfinance.prototype.alias=function(id,payment){
  return (id+payment.issuer.toLowerCase()).hash().crypt();
}

PaymentPostfinance.prototype.isValidSha=function (payload) {
  return this.postfinance.isValidSha(payload);
}

PaymentPostfinance.prototype.ecommerceForm=function(user,callback){

	//
	// prepare the card
  var postfinanceCard = {
    paymentMethod: 'postfinance card',
    email:user.email.address,
    firstName: user.name.givenName,
    lastName: user.name.familyName,
  };

  // add addresse
	if(user.addresses.length){
		postfinanceCard.address1=user.addresses[0].streetAdress;
		postfinanceCard.zip=user.addresses[0].postalCode
		postfinanceCard.city=user.addresses[0].region
	}
  var card = new postfinance.Card(postfinanceCard);
  var alias=(user.id+card.issuer.toLowerCase()).hash()

  var options={
  	alias:alias, 
  	aliasUsage:'Karibou payment',
  	title:'Enregistrement de votre carte chez Postfinance',
  	bgcolor:'#F2F4F2',
  	tp:"http://api.karibou.evaletolab.ch/v1/psp/std",
  	paramplus:'createAlias=true&user='+user.id,
  }

  // generate form
  card.publishForEcommerce(options,function(err,res) {
  	if(!res.alias)res.alias=alias.crypt()
		return callback(err,card, res)  		
  });
}


//
// validate a card or alias and get new Card by callback
PaymentPostfinance.prototype.card=function(payment, callback){
  try{
  	var isCard=(payment.number),
  		method=(isCard)?
  	{
  		name:payment.name,
  		expiry:payment.expiry,
  		number:payment.number,
  		csc:payment.csc
  	}:{
  		alias:payment.alias
  	}

    var card=new postfinance.Card(method)

    if(isCard){
		  if(!card.isValid()){
		    return callback(new Error("Cette carte n'est pas valide"))
		  }

		  if(card.isExpired()){
		    return callback(new Error("Cette carte n'est plus valide"))
		  }
		}
	  return callback(null,postfinance, card)
  }catch(e){
    return callback(e)
  }


}

PaymentPostfinance.prototype.addCard=function (user,payment) {
	var deferred = Q.defer(), self=this, result={};

  // try to build the card
  return this.card(method,function(err, postfinance, card){
    
    if(err){
      return Q.reject(new Error(err.message))
    }


    // for security reason alias is crypted
    var alias=(id+card.issuer.toLowerCase()).hash()
    result.alias=alias.crypt();
    result.issuer=card.issuer.toLowerCase();
    result.name=method.name;
    result.number=card.hiddenNumber;
    result.expiry=card.month+'/'+(2000+card.year);
    result.updated=Date.now();

    card.publish({alias:alias},function(err,res){
      if(err){
		    return deferred.reject(err.message);
      }

      return deferred.resolve(result)
    })

		// return promise
		return deferred.promise;
  });

}

PaymentPostfinance.prototype.charge=function(options,alias,user){
  return Q.reject(new Error("Impossible de payer avec cette méthode"));
}

//
// authorize a new payment for this order
PaymentPostfinance.prototype.authorize=function(order){
	var deferred = Q.defer();
	try{

		// only partial and reserved has status auth
		if(["reserved"].indexOf(order.fulfillments.status)===-1){
      return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
    }
	
		if(["pending"].indexOf(order.payment.status)===-1){
	    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
	  }

	  var card=new postfinance.Card({
	    alias: order.payment.alias.decrypt()
	  })

	  transaction = new postfinance.Transaction({
	    operation: 'authorize',
	    amount:order.getTotalPrice(config.payment.reserve),
	    orderId: 'TX'+order.oid,
	    email:order.customer.email.address,
	    groupId:(order.shipping.when+'').substring(0,14)
	  });
	}catch(err){
	  //
	  // cancel order and rollback product item from stocks
    order.fulfillments.status="failure";
    order.payment.status='voided';
	  order.rollbackProductQuantityAndClose("system",function(e){
	    deferred.reject(err);
	  })
    return deferred.promise;
	}


	transaction.process(card, function(err,result){
	  if(err){
      order.fulfillments.status="failure";
      order.payment.status='voided';
	    return order.rollbackProductQuantityAndClose("system",function(e){
		  	deferred.reject(err);
	    });
	  }

	  //
	  // get authorisation, save status and transaction
	  order.payment.status="authorized";
	  order.payment.transaction=transaction.toJSON().crypt();
	  order.save(function(err){
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
// cancel  an authorization for this order
PaymentPostfinance.prototype.cancel=function(order,reason){
	var deferred = Q.defer(),self=this;
	try{

		// only reserved can be cancelled 
		// (partial mean that almost one item is fulfilled and must be payd)
		if(["reserved"].indexOf(order.fulfillments.status)===-1){
      return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.fulfillments.status))
    }

    // only authorized can be cancelled
		if(['authorized'].indexOf(order.payment.status)===-1){
      return Q.reject(new Error("Impossible d'annuler une commande avec le status: "+order.payment.status))
    }

		// loading card from alias 
	  var card=new postfinance.Card({
	    alias: order.payment.alias.decrypt()
	  })

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  // getting transaction
    var transaction=new self.postfinance.Transaction(order.payment.transaction.decrypt())
    transaction.update({operation:'cancel'});
    return transaction.process(card, function(err,res){
    	if(err){
    		return deferred.reject(err);		
    	}

		  order.fulfillments.status='failure';
      order.payment.status="voided";
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
	}catch(err){
		console.log('postfinance',err)
    return Q.reject(new Error('Votre méthode de paiement est invalide (PF)'));
	}

	// return promise
	return deferred.promise;
}

//
// refund this order
PaymentPostfinance.prototype.refund=function(order,reason){
	var deferred = Q.defer(),self=this;
	try{

  	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
      return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.fulfillments.status))
  	}

		if(['paid','partially_paid'].indexOf(order.payment.status)===-1){
      return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.payment.status))
    }

		// loading card from alias 
	  var card=new postfinance.Card({
	    alias: order.payment.alias.decrypt()
	  })

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  // getting transaction
    var transaction=new self.postfinance.Transaction(order.payment.transaction.decrypt())
    return transaction.refund(card, function(err,res){
    	if(err){
    		return deferred.reject(err);		
    	}

		  order.fulfillments.status='failure';
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
	}catch(err){
		console.log('postfinance',err)
    return Q.reject(new Error('Votre méthode de paiement est invalide (PF)'));
	}

	// return promise
	return deferred.promise;
}

//
// capture this authorized order
PaymentPostfinance.prototype.capture=function(order,reason){
	var deferred = Q.defer(),self=this;
	try{

  	if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
      return Q.reject(new Error("Impossible de payer une commande en cours avec le status: "+order.fulfillments.status))
  	}

		if(['authorized'].indexOf(order.payment.status)===-1){
      return Q.reject(new Error("Impossible de payer une commande avec le status: "+order.payment.status))
    }

		// loading card from alias 
	  var card=new postfinance.Card({
	    alias: order.payment.alias.decrypt()
	  })

	  if(!order.payment.transaction){
	  	return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
	  }

	  // getting transaction
    var transaction=new self.postfinance.Transaction(order.payment.transaction.decrypt())
    transaction.update({
    	operation:'capture',
    	amount:order.getTotalPrice()
    });

    transaction.process(card, function(err,res){
    	if(err){
    		return deferred.reject(err);		
    	}

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
	}catch(err){
		console.log('postfinance',err)
    return Q.reject(new Error('Votre méthode de paiement est invalide (PF)'));
	}

	// return promise
	return deferred.promise;
}


module.exports=function(_super){
	return new PaymentPostfinance(_super)
};
