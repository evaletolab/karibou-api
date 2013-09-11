#!/bin/env node

//
//
var app = require('./app/index');
var maintain=require('./app/db.maintain');
//var mongoose=require('mongoose');


/** */
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(config.mongo.name, function(err, db) {     
  maintain.update(db,function(err,log){
    console.log("maintain",err,log);
    process.exit(1);
  });

});

/**
mongoose.connection.on('open', function(db) {

  maintain.update(mongoose.connection.db,function(err,log){
    console.log("maintain",err,log);
    process.exit(1);
  });

});

*/
