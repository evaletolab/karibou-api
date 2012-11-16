
/**
 * Module dependencies.
 */

var application_root = __dirname;
var express = require('express');
var path = require('path');

var config = require('./config');
var pkgname = require('../package').name;
var debug = require('debug')('app');
var mongoose = require('mongoose');


var app = module.exports = express();


app.Redis = require('redis');

if (config.redis){
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

// connect to Mongo when the app initializes
mongoose.connect('mongodb://localhost/karibou-test');


// config
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


require('../controllers/config')(app);
