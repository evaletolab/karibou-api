#!/bin/env node

//
//
var app = require('./app/index');
var maintain=require('./app/db.maintain');
var mongoose=require('mongoose');


/**
  var MongoClient = require('mongodb').MongoClient;
  MongoClient.connect(config.mongo.name, function(err, db) {     
    var Products=db.collection('products');
    console.log("conn",config.mongo.name);
    
    db.collection('products').find().toArray(function(err, products){
      console.log(err,products[0])
    });
    process.exit();

  });
**/
mongoose.connection.on('open', function(db) {

  maintain.update(mongoose.connection.db,function(err,log){
    console.log("maintain",err,log);
    process.exit(1);
  });

});


