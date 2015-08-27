var Q=require('q');
var bus = require('../app/bus');


var Payment=function(){
	function parseError (err) {
		return err
	}
	//
	// commons
	var privatePayment={
		//
		// validate a card or alias and get new Card by callback
		removeCard:function(provider, user, alias){
			var deferred = Q.defer(), self=this;

			if(user.email&&user.email.status!==true){
		    return Q.reject(new Error("Votre email doit être validé pour supprimer une méthode de paiement"))
			}
			if(!user.status){
		    return Q.reject(new Error("Votre compte est désactivé"))
			}



			return provider(deferred,function (err,confirmation) {
		  	if(err){
			    return deferred.reject(parseError(err));
		  	}
		    return deferred.resolve(confirmation);
			})

		},

		//5
		// validate a card or alias and get new Card by callback
		addCard:function(provider, user, payment){
			var deferred = Q.defer()
			if(user.email&&user.email.status!==true){
		    return Q.reject(new Error("Votre email doit être validé pour ajouter une méthode de paiement"))
			}
			if(!user.status){
		    return Q.reject(new Error("Votre compte est désactivé"))
			}

			return provider(deferred,function (err,card) {
		  	if(err){
			    return deferred.reject(parseError(err));
		  	}
		    return deferred.resolve(card);
			})
		},


		//
		// authorize a new payment for this order
		authorize:function(provider, order){
			var deferred = Q.defer()

			// only partial and reserved has status auth
			if(["reserved"].indexOf(order.fulfillments.status)===-1){
		    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
		  }

			if(["pending"].indexOf(order.payment.status)===-1){
		    return Q.reject(new Error("Impossible d'autoriser une commande avec le status: "+order.fulfillments.status))
		  }

			return provider(deferred, function(err, charge) {
			  if(err){
	        bus.emit('system.message',"[authorize-danger] save:",{error:err.message,order:order.oid,customer:order.email});
			    order.fulfillments.status="failure";
			    order.payment.status='voided';
				  return order.rollbackProductQuantityAndClose("system",function(e){
				    deferred.reject(parseError(err));
				  })		  				  
			  }
			  //
			  // get authorisation, save status and transaction
			  order.payment.logs=[charge.log]
			  order.payment.status="authorized";
			  order.payment.transaction=charge.transaction;
			  order.save(function(err){
			    if(err){
			    	// never be there!!
			    	// it's not possible to get gateway authorization and an issue to save it in our local storage 
		        bus.emit('system.message',"[authorize-danger] save:",{error:err.message,order:order.oid,customer:order.email});
					  return deferred.reject(err);
			    }
			    // do not export it!
			    order.payment.transaction=undefined;
			    return deferred.resolve(order);
			  })

			});	  

		},

		//
		// cancel  an authorization for this order
		cancel:function(provider,order,reason){
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


			// return promise
			return provider(deferred,function(err, refund) {
		  	if(err){
		  		return deferred.reject(parseError(err));		
		  	}
			  order.fulfillments.status='failure';
		  	order.payment.logs.push(refund.log)
		    order.payment.status="voided";
		    order.payment.transaction=refund.transaction
		    return order.rollbackProductQuantityAndClose(reason, function(err){
			    if(err){
			    	// never be there!!
		        bus.emit('system.message',"[cancel-danger] save:",{error:err.message,order:order.oid,customer:order.email});
					  return deferred.reject(err);
			    }
			    // do not export it!
			    order.payment.transaction=undefined;
			    return deferred.resolve(order);
		    })
		  });
		},

		//
		// refund this order
		refund:function(provider, order,reason, amount){
			var deferred = Q.defer(),self=this;

			if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
		    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.fulfillments.status))
			}

			if(['paid','partially_paid'].indexOf(order.payment.status)===-1){
		    return Q.reject(new Error("Impossible de rembourser une commande avec le status: "+order.payment.status))
		  }


		  //
		  // create full refund 
			return provider(deferred,function(err, refund) {
		  	if(err){
		  		return deferred.reject(parseError(err));		
		  	}

			  order.fulfillments.status='failure';
		  	order.payment.logs.push(refund.log)
		    order.payment.transaction=refund.transaction
		    order.payment.status="refunded";
		    order.cancel={}
		    order.cancel.reason=reason;
		    order.cancel.when=new Date();
		    order.closed=new Date();
		    return order.save(function(err){
			    if(err){
			    	// never be there!!
		        bus.emit('system.message',"[refund-danger] save:",{error:err.message,order:order.oid,customer:order.email});
					  return deferred.reject(err);
			    }
			    // do not export it!
			    order.payment.transaction=undefined;
			    return deferred.resolve(order);
		    })
		  });

		},

		//
		// capture this authorized order
		capture:function(provider,order,reason){
			var deferred = Q.defer(),self=this;

			if(["fulfilled"].indexOf(order.fulfillments.status)===-1){
		    return Q.reject(new Error("Impossible de payer une commande en cours avec le status: "+order.fulfillments.status))
			}

			if(['authorized'].indexOf(order.payment.status)===-1){
		    return Q.reject(new Error("Impossible de payer une commande avec le status: "+order.payment.status))
		  }


		  return provider(deferred,function (err, charge) {
		  	if(err){
		  		return deferred.reject(parseError(err));		
		  	}
		  	order.payment.logs.push(charge.log)
		    order.payment.status="paid";
		    order.closed=new Date();
		    return order.save(function(err){
			    if(err){
			    	// never be there!!
		        bus.emit('system.message',"[capture-danger] save:",{error:err.message,order:order.oid,customer:order.email});
					  return deferred.reject(err);
			    }
			    return deferred.resolve(order);
		    })
		  })

		}
	}



	// this.postfinance =require('./payment.postfinance')(privatePayment)
	this.stripe =require('./payment.stripe')(privatePayment)
	this.invoice =require('./payment.invoice')(privatePayment)
	this.tester =require('./payment.test')(privatePayment)
}

//
// get provider in regard of issuer 
Payment.prototype.for=function(issuer){
	var map={
		// 'postfinance card':this.postfinance,
		// 'paypal':this.postfinance,
		'american express':this.stripe,
		'visa':this.stripe,
		'mastercard':this.stripe,	
		'bitcoin':this.stripe,	
		'invoice':this.invoice,	
		'tester':this.tester
	}
	if(issuer && map[issuer.toLowerCase()]){
		return map[issuer.toLowerCase()];
	}

	throw new Error('Could not find payment method: '+issuer)
}

//
// compute fees in regard of issuer
Payment.prototype.fees=function(issuer, amount){
  for(var p in config.shop.order.gateway){
    if(config.shop.order.gateway[p].label===issuer){
      return config.shop.order.gateway[p].fees*amount
    }
  }
  // 
  return 0.0;
}

module.exports=new Payment()
