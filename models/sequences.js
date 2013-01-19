
var debug = require('debug')('sequences');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('./validate')
  , ObjectId = Schema.ObjectId;
  


var Sequences = new Schema({
    name:String,
    seq:{type:Number,min:100000, default:100000}
});


//
// SEQUENCES API

Sequences.statics.next = function(name, callback){
  	var Sequences=this.model('Sequences');
  	var newSeq;
  	Sequences.findOne({name:name}, function(err, n){
  	  if (!n){
    	  n=new Sequences({name:name});
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
  this.model('Sequences').next("sku",callback);
};


module.exports =mongoose.model('Sequences', Sequences);


