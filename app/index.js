
/**
 * Module dependencies.
 */

var application_root = __dirname;
var express = require('express');
var path = require('path');

var config = require('./config');
var debug = require('debug')('app');


var app = module.exports = express();


//export config
global.config=config;


//
// configure redis layer with zrevrangebyscore
// -> http://expressjs.com/guide.html#users-online
if (config.redis){
	app.Redis = require('redis');
	app.redisCreateClient = function() {
		if (config.redis.socket) {
		  config.redis.port = config.redis.socket;
		  config.redis.host = null;
		}

		return app.Redis.createClient(config.redis.port,
		                              config.redis.host,
		                              config.redis.options);
	};
	app.redis = app.redisCreateClient();
}



for (var name in config.express) {
  app.set(name, config.express[name]);
}

//
// CORS middleware
// Allow cross-domain 
var CORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', config.cors.allowedDomains);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}


// config
// TODO check error handling options http://expressjs.com/guide.html#error-handling
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.cookieParser());
  app.use(CORS);  
  app.use(express.static('public'));
  app.locals.pretty = true;
});



require('./models')(app, express);
require('./controllers')(app);
