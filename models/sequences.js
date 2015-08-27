
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
// SEQUENCES API


Sequences.statics.next =  function(name, start, callback){
  	var Sequences=this.model('Sequences');
  	var newSeq;
    if(typeof start === 'function'){
      callback=start;
      start=1000000;
    }

    Sequences.findOneAndUpdate({name:name},{$inc: {seq:1}}, { new: true }, function(err,counter){
    // this.collection.findAndModify({name:name}, [], {$inc: {seq:1}}, { new: true }, function(err,counter){
        if(counter){
          //console.log("update",counter.seq)      
          return callback(err,counter.seq);  
        }
        new Sequences({name:name,seq:start}).save(function(err,n){
          callback(err,n.seq);
        });

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


