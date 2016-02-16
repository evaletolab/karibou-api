#!/bin/env node
//
// check links
// https://github.com/madhums/node-express-mongoose-demo
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
// mongo/express sample 
// https://gist.github.com/1025038
// dynamic helpers
// http://stackoverflow.com/questions/6331776/accessing-express-js-req-or-session-from-jade-template
// http://stackoverflow.com/questions/11580796/migrating-express-js-2-to-3-specifically-app-dynamichelpers-to-app-locals-use

//
// start newrelic logs here
//require('newrelic');

if(process.env.NODETIME_KEY){
  var nodetime=require('nodetime').profile({
      accountKey:process.env.NODETIME_KEY, 
      appName: process.env.NODETIME_APP
  });
}

if (process.env.MEWRELIC_KEY){
  var newrelic=require('newrelic')
}

if(process.env.VCAP_SERVICES){
    //var vcap = JSON.parse(process.env.VCAP_SERVICES);
}

//
// load env
var express = require('express')
  , fs = require('fs')
  , passport = require('passport')

  , env = process.env.NODE_ENV || 'development'
  , config = require('./app/config')
  , mongoose = require('mongoose')
  , _ = require('underscore');


//
// open database
mongoose.connect(config.mongo.name,{server:{safe:true, auto_reconnect:true}},function(e){  
    //double check for database drop
    console.log("boot[",new Date(),"] :",mongoose.connection.db.databaseName, config.mongo.name)

    if(process.env.NODE_ENV!=='test'){
      console.time("running db maintain")
      require('./app/db.maintain').update(mongoose.connection.db,function(err,log){
        if(err){
          console.log("ERROR",err)
        }
        console.timeEnd("running db maintain")
      });            
    }

    if(config.dropdb && process.env.NODE_ENV==='test'){
      mongoose.connection.db.dropDatabase(function(err,done){
      });
    }
});

//mongoose.set('debug', function (collectionName, method, query, doc) {
 // Here query is what you are looking for.
 // so whatever you want to do with the query
 // would be done in here
 // console.log('DEBUG ------------------',query)
//})

//
// configure karibou-wallet
require("karibou-wallet")({
  allowMultipleSetOption:true,
  apikey:config.payment.karibou.apikey,
  allowMaxAmount:config.payment.allowMaxAmount,
  debug:config.mail.develMode,
  mongo:{
    name:config.mongo.multiple,
    multiple:(config.mongo.multiple)?true:false
  }
});

//
// configure postfinance
var settings={};
settings.allowMultipleSetOption = false;
settings.sandbox = config.payment.postfinance.sandbox; 
settings.enabled = config.payment.postfinance.enabled||false; 
settings.debug = config.payment.postfinance.debug||false; 
settings.pspid = config.payment.postfinance.pspid;
settings.apiUser=config.payment.postfinance.apiUser;
settings.apiPassword = config.payment.postfinance.apiPassword;
settings.shaSecret = config.payment.postfinance.shaSecret;

require("node-postfinance").configure(settings);


// load models
files = require("fs").readdirSync( './models' );
for(var i in files) {
  if(/\.js$/.test(files[i])) require('./models/'+files[i]);
}

// extend config right after db is ready
mongoose.model('Config').getMain(function(err,c){
  if(err){
    console.log('Ooops error when reading stored config',err)
    process.exit(1)    
  }
  _.extend(config.shared,c)
})

var app = express()


// utils 
require('./app/utils')(app);

// Events Bus
var bus=require('./app/bus');require('./app/bus.routes');

// mailer
require('./app/mail')(app,bus);
  

// payment api
var payment=require('./app/payment');
  


// express settings
require('./app/express')(app, config, passport)

// bootstrap passport config
require('./app/passport')(app, config, passport)

// Bootstrap routes
require('./app/routes')(app, config, passport)


console.log("generate random key:",require('crypto').randomBytes(32).toString('base64'))

//
// maintain db
//
//
//
// start the server
var host = (process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || config.express.host || 'localhost');


var count=0;
app.listen(app.get('port'),host).on('connection', function(socket) {
  // console.log("---- new connection was made by a client: ",socket.remoteAddress,"c:", ++count);
  socket.on('end',function(){
    // console.log("---- close connection made by a client: ",socket.remoteAddress,"c:", --count);
  })

})



//
// manage unmanaged exception
process.on('uncaughtException', function(err) {

  if(process.env.NODE_ENV==='production'){
    var msg=(err.stack)?err.stack:JSON.stringify(err,null,2);
    bus.emit('sendmail',"evaleto@gmail.com",
         "[karibou] uncaughtException "+err.toString(), {content:msg}, "simple",
    function (err,status) {
      console.log(err,status)
      process.exit(1)
    });

  }
  console.log("uncaughtException",err.stack);
});



// expose app
exports = module.exports = app





