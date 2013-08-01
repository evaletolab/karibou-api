#!/bin/env node
//
// check links
// https://github.com/datapimp/backbone-express-mongoose-socketio
// mongo/express sample 
// https://gist.github.com/1025038
// dynamic helpers
// http://stackoverflow.com/questions/6331776/accessing-express-js-req-or-session-from-jade-template
// http://stackoverflow.com/questions/11580796/migrating-express-js-2-to-3-specifically-app-dynamichelpers-to-app-locals-use

//
// start newrelic logs here
require('newrelic');

//var pkgname = require('./package').name;

//var nodetime=require('nodetime').profile({
//    accountKey:'f39e0560aedf625a03b0b06dbcb015907c1a3736', 
//    appName: 'Karibou'
//});
  
var debug = require('debug')('app');
var app = require('./app/index');

// update the db if necessary
//require('./app/db.maintain').update();

var port = (process.env.VMC_APP_PORT || process.env.C9_PORT || config.express.port);
var host = (process.env.VMC_APP_HOST || 'localhost');

// manage c9 env
if (process.env.C9_PORT ){
    host='0.0.0.0';
}

if (process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP){
    host=process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP;
}
if (process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT){
    port=process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT;
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






