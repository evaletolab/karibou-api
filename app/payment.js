

var Payment=function(){
	this.postfinance =require('./payment.postfinance')(this)
	this.invoice =require('./payment.invoice')(this)
}

Payment.prototype.for=function(issuer){
	if(['postfinance','american express','visa','mastercard','paypal'].indexOf(issuer)!==-1){
		return this.postfinance;
	}else if(issuer==='invoice'){
		return this.invoice;
	}else if(issuer==='bitcoin'){
		throw new Error('Could not find payment method: '+issuer)
	}else if(issuer==='tester'){
		return this;
	}
	throw new Error('Could not find payment method: '+issuer)
}


module.exports=new Payment()
