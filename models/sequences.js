
var debug = require('debug')('sequences');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  

//
// wrap a request to a simple queuing system. 
// This should help to avoid race condition on product 
var queue=require('../app/queue')(1,true);
var queued=function(f){
  return function(req,res){
    queue.defer(f,req,res)
  }
}



var Sequences = new Schema({
    name:{type:String, unique:true},
    seq:{type:Number,min:100000, default:1000000}
});

//
Sequences.statics.initNumber = function(name,value){
  var init_Sequences={
    sku:1000000,
    oid:2000000,
    uid:8000000
  }
  if(!init_Sequences[name]){
    init_Sequences[name]=value;
  }

  return init_Sequences[name];
};


//
// SEQUENCES API


Sequences.statics.next =  function(name, start, callback){
    var promise = new mongoose.Promise;
  	var Sequences=this.model('Sequences');
  	var newSeq;
    if(typeof start === 'function'){
      callback=start;
      start=this.initNumber(name,10000000);
    }

    //
    // attach callback to promise
    if(callback){
      promise.addBack(callback);
    }

    // FIXME race condition here : ,{'$setOnInsert':{name:name,seq:start},{upsert:false}
    Sequences.findOneAndUpdate({name:name},{$inc: {seq:1}}, {new:true }, function(err,counter){
      if(err){
        return promise.reject(err);
      }
      if(counter){
        return promise.resolve(null,counter.seq);
        // return callback(err,counter.seq);  
      }
      new Sequences({name:name,seq:start}).save(function(err,n){
        return promise.resolve(null,n.seq);
        // callback(err,n.seq);
      });
    });
    return promise;
}; 



// simple wrapper for SKU
Sequences.statics.nextSku = function( callback){
  return this.model('Sequences').next("sku",this.initNumber('sku'),callback);
};

// simple wrapper for Order ID
Sequences.statics.nextOrder = function( callback){
  return this.model('Sequences').next("oid",this.initNumber('oid'),callback);
};

// simple wrapper for Order ID
Sequences.statics.nextUser = function( callback){
  return this.model('Sequences').next("uid",this.initNumber('uid'),callback);
};

Sequences.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Sequences', Sequences);


