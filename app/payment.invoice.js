var util = require("util");
var events = require("events");
var bus = require('../app/bus');
var db = require('mongoose');
var Q=require('q');


var PaymentInvoice=function(_super){
  this._super=_super;
}

// Helper for year normalization
function normalizeYear(order, year) {
  return (Math.floor(new Date().getFullYear() / order) * order) + year;
}

function parseYear (year) {
    if (!year) { return; }

    year = parseInt(year, 10);
    if (year < 10) {
      yearVal = normalizeYear(10, year);
    } else if (year >= 10 && year < 100) {
      yearVal = normalizeYear(100, year);
    } else if (year >= 2000 && year < 2050){
      yearVal = parseInt(year)-2000;
    } else {
      yearVal = year;
    }
    return yearVal+2000;
}
//
// verify if an alias belongs to the user
PaymentInvoice.prototype.isValidAlias=function(alias, user, method){
    //
    // constrain with a date limit
  var expiry='invoice';
  // if(method.expiry){
  //   expiry+=':'+method.expiry;
  // }

  return ((user.id+expiry).hash().crypt()===alias);
}

//
// verify if an alias is valid and decode it
PaymentInvoice.prototype.decodeAlias=function(alias, user, method){
  try{
    //
    // constrain with a date limit
    var expiry='invoice';
    // if(method.expiry){
    //   expiry+=':'+method.expiry;
    // }
    if((user.id+expiry).hash().crypt()===alias){
      return {id:user.id,gateway_id:null,card_id:null}
    }
  }catch(e){}

  return false;
}

PaymentInvoice.prototype.alias=function(user_id,payment){
  //
  // constrain with a date limit
  var expiry=payment.issuer.toLowerCase();  
  // if(payment.expiry){
  //   expiry+=':'+payment.expiry;
  // }
  return (user_id+expiry).hash().crypt();
}

//
// check if method fields are ok
PaymentInvoice.prototype.isPaymentObjectValid=function(payment){
  return (payment&&payment.alias&&payment.issuer);
}



//
// check stripe customer
PaymentInvoice.prototype.checkCard=function(user,alias){
  var deferred = Q.defer(), stripePromise, self=this, result={};



  //
  // check alias
  var handleStripe=this.decodeAlias(alias,user);
  if(!handleStripe){
    return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"))
  }

  var payment=user.getPaymentMethodByAlias(alias);
  if(!payment){
    return Q.reject(new Error("Cette carte n'est pas attachée à votre compte"))   
  }

  //
  // checking payment method
  db.model('Orders').findByCriteria({user:user.id,payment:'invoice'},function (err, orders) {
    if(err){
      return deferred.reject(err);
    }

    // check open invoice
    if(orders.length>config.shared.order.openInvoice){
      return deferred.reject(new Error("Le paiement par facture n'est plus disponible lorqu'il existe des factures ouvertes"))
    }

    // invoice is ok
    return deferred.resolve(payment);
  });


  // return promise
  return deferred.promise;

}


//
// validate a card or alias and get new Card by callback
PaymentInvoice.prototype.removeCard=function(user, alias){
  var self=this;
  var _removeCard=function (deferred, callback) {
    //
    // check alias
    var handleStripe=self.decodeAlias(alias,user);
    if(!handleStripe){
      return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"))
    }


    return Q.when(true)

  }

  return this._super.removeCard(_removeCard,user,alias)
}

//
// validate a card or alias and get new Card by callback
PaymentInvoice.prototype.addCard=function(user, payment){
  var stripePromise, self=this, result={};


  var _addCard=function (deferred, callback) {    
    var expiry=payment.expiry.split('/'),
        year=parseYear(expiry[1]),month=parseInt(expiry[0]);
    if(isNaN(month)||year===undefined||year>2050||year<2000||month<1||month>12){
      setTimeout(function() {
        callback(new Error("La date d'expiration du service de paiement n'est pas valide MM/YYYY"));
      }, 0);
      return deferred.promise;    
    }


    result={
      alias:self.alias(user.id,payment),
      number:payment.number,
      issuer:payment.issuer.toLowerCase(),
      name:payment.name,
      expiry:month+'/'+year,
      updated:Date.now(),
      provider:'invoice'
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
// simple charge wrapper
PaymentInvoice.prototype.charge=function (options,alias,user) {
  var self=this;
  var _charge=function (deferred, callback) {

    // check alias, in this case the order status is affected
    var handleStripe=self.decodeAlias(alias,user);
    if(!handleStripe){
      return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
    }

    return Q.reject(new Error("Ce mode de paiement n'est pas valable dans ce context"));
  }

  // return promise
  return this._super.charge(_charge, options);
}

//
// authorize a new payment for this order
PaymentInvoice.prototype.authorize=function(order){
  var self=this;
  var _authorize=function (deferred, callback) {

    //
    // check alias, in this case the order status is affected
    var handleStripe=self.decodeAlias(order.payment.alias,order.customer);
    if(!handleStripe){
      setTimeout(function() {
        callback(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
      }, 0);
      return deferred.promise        
    }

    //
    // check date
    if(order.payment.expiry){
      var expiry=order.payment.expiry.split('/'),
          dt,now=new Date();
      dt=new Date(parseYear(expiry[1]), (parseInt(expiry[0])), 0)
      if(dt<now){
        setTimeout(function() {
          callback(new Error("Le service de paiement n'est plus disponible"));
        }, 0);
        return deferred.promise        
      }
    }


    var result={
      log:'authorized amount '+(Math.round(order.getTotalPrice(config.payment.reserve)))+' the '+new Date(),
      transaction:(order.oid+'').crypt(),
      updated:Date.now(),
      provider:'invoice'
    };

    //
    // check open invoice
    db.model('Orders').findByCriteria({user:order.customer.id,payment:'invoice'},function (err, orders) {

      if(err){
        return callback(err);
      }

      // check open invoice
      if(orders.length>config.shared.order.openInvoice){
        return callback("Le paiement par facture n'est plus disponible lorqu'il existe des factures ouvertes")
      }

      // invoice is ok
      return callback(null,result);
    });


    return deferred.promise;    
  } 
  // return promise
  return this._super.authorize(_authorize, order);
}

//
// cancel  an authorization for this order
PaymentInvoice.prototype.cancel=function(order,reason){
  var self=this;
  var _cancel=function (deferred, callback) {

    //
    // for capture, cancel and refund the order status is not changed
    if(!self.isValidAlias(order.payment.alias, order.customer)){
      return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
    }
    if(!order.payment.transaction){
      return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
    }

    var result={
      log:'cancel '+(Math.round(order.getTotalPrice(config.payment.reserve)))+' the '+new Date(),
      transaction:(order.oid+'').crypt(),
      updated:Date.now(),
      provider:'invoice'
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
PaymentInvoice.prototype.refund=function(order,reason, amount){
  var self=this;
  //
  // create full refund 
  var _refund=function (deferred, callback) {

    //
    // for capture, cancel and refund the order status is not changed
    if(!self.isValidAlias(order.payment.alias, order.customer)){
      return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
    }

    if(!order.payment.transaction){
      return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
    }

    //
    // verify max refund amount
    var maxamount=Math.round(order.getTotalPrice(config.payment.reserve));
    var refund=amount||maxamount;
    if(amount>maxamount){
      refund=maxamount;
    }
    var result={
      log:'refund '+refund+' the '+new Date(),
      transaction:(order.oid+'').crypt(),
      updated:Date.now(),
      provider:'invoice'
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
PaymentInvoice.prototype.capture=function(order,reason){
  var self=this, 
      options=options||{},
      error=null;

  var _capture=function (deferred, callback) {

    //
    // for capture, cancel and refund the order status is not changed
    if(!self.isValidAlias(order.payment.alias, order.customer)){
      return Q.reject(new Error("La référence de la carte n'est pas compatible avec le service de paiement"));
    }

    if(!order.payment.transaction){
      return Q.reject(new Error('Aucune transaction est attachée à votre commande'))
    }


    var amount=order.getTotalPrice();
    var status='invoice';
    var log='invoice '+amount+' the '+new Date();

    //
    // new invoice event
    if(reason==='invoice'){

    }
    else if(order.payment.status==='invoice'){
      log='captured '+amount+' the '+new Date();
      status='paid';
    }

    var result={
      log:log,
      status:status,
      transaction:(order.oid+'').crypt(),
      updated:Date.now(),
      provider:'invoice'
    };

    setTimeout(function() {
      callback(error,result);
    }, 0);
    return deferred.promise;
  }

  return this._super.capture(_capture,order)

}


module.exports=function(_super){
  return new PaymentInvoice(_super)
};
