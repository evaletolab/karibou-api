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

//
// load env
var express = require('express')
  , fs = require('fs')
  , passport = require('passport')

  , env = process.env.NODE_ENV || 'development'
  , config = require('./app/config')
  , mongoose = require('mongoose')


//
// open database
mongoose.connect(config.mongo.name,function(e){  
    //double check for database drop
    console.log("info :",mongoose.connection.db.databaseName, config.mongo.name)
    

    if(config.dropdb && process.env.NODE_ENV==='test'){
      mongoose.connection.db.dropDatabase(function(err,done){
      });
    }
});

// load models
files = require("fs").readdirSync( './models' );
for(var i in files) {
  if(/\.js$/.test(files[i])) require('./models/'+files[i]);
}

var app = express()


// utils 
require('./app/utils')(app);

// mailer
var sendmail=require('./app/mail')(app);
  
// bootstrap passport config
require('./app/passport')(app, config, passport)

// express settings
require('./app/express')(app, config, passport, sendmail)

// Bootstrap routes
require('./app/routes')(app, config, passport)





//
//
// start the server
var port = (process.env.VMC_APP_PORT || process.env.VCAP_APP_PORT || process.env.C9_PORT || process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || config.express.port);
var host = (process.env.VMC_APP_HOST || process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || 'localhost');

// manage c9 env
if (process.env.C9_PORT ){
    host='0.0.0.0';
}

/**
 *  Setup termination handlers (for exit and a list of signals).
 */
var setupTerminationHandlers = function(){
    //  Process on exit and signals.
    process.on('exit', function() {  
      // send mail on exit?
    });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
     'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { 
          // soft terminate
          // process.exit(1);
        });
    });
};
app.listen(port,host);

// expose app
exports = module.exports = app





