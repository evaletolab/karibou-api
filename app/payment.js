

var Payment=function(){
	this.postfinance =require('./payment.postfinance')(this)
	this.stripe =require('./payment.stripe')(this)
	this.invoice =require('./payment.invoice')(this)
}

Payment.prototype.for=function(issuer){
	if(issuer && ['postfinance card','paypal'].indexOf(issuer.toLowerCase())!==-1){
		return this.postfinance;
	}else if(issuer && ['american express','visa','mastercard'].indexOf(issuer.toLowerCase())!==-1){
		return this.stripe;
	}else if(issuer==='invoice'){
		return this.invoice;
	}else if(issuer==='bitcoin'){
		throw new Error('Could not find payment method: '+issuer)
	}else if(issuer==='tester'){
		return this;
	}
	throw new Error('Could not find payment method: '+issuer)
}

Payment.prototype.issuerFees=function(issuer, amount){
  for(var p in config.shop.order.gateway){
    if(config.shop.order.gateway[p].label===issuer){
      return config.shop.order.gateway[p].fees*amount
    }
  }
  // 
  return 0.0;
}




module.exports=new Payment()
