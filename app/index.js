
/**
 * Module dependencies.
 */

var application_root = __dirname;
var express = require('express');
var path = require('path');

var config = require('./config');
var pkgname = require('../package').name;
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



// config
// TODO check error handling options http://expressjs.com/guide.html#error-handling
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.cookieParser());
  app.use(express.static(path.join(application_root, "public")));
});



require('./models')(app, express);
require('./controllers')(app);
