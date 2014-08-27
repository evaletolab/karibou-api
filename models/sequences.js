
var debug = require('debug')('sequences');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  


var Sequences = new Schema({
    name:String,
    seq:{type:Number,min:100000, default:1000000}
});


//
// SEQUENCES API


Sequences.statics.next = function(name, start, callback){
  	var Sequences=this.model('Sequences');
  	var newSeq;
    if(typeof start === 'function'){
      callback=start;
      start=1000000;
    }

  	Sequences.findOne({name:name}, function(err, n){
  	  if (!n){
    	  n=new Sequences({name:name,seq:start});
    	  n.save(function(err){
          debug("get next sequence ("+name+":"+n.seq+") err:"+err );
      	  callback(err,n.seq);
    	  });
  	  }else{

  	    n.update({$inc: {seq:1}}, { safe: true }, function(err,inc){
            debug("get next sequence ("+name+":"+n.seq+inc+") err:"+err );
         	  callback(err,n.seq+inc);
  	    });
  	  }
  	});  	  	
}; 

// simple wrapper for SKU
Sequences.statics.nextSku = function( callback){
  this.model('Sequences').next("sku",1000000,callback);
};

// simple wrapper for Order ID
Sequences.statics.nextOrder = function( callback){
  this.model('Sequences').next("oid",2000000,callback);
};

// simple wrapper for Order ID
Sequences.statics.nextUser = function( callback){
  this.model('Sequences').next("uid",8000000,callback);
};

Sequences.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Sequences', Sequences);


