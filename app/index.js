
/**
 * Module dependencies.
 */

var application_root = __dirname;
var express = require('express');
var path = require('path');

var config = require('./config');
var debug = require('debug')('app');


var app = module.exports = express();
var token = require('password-generator');


// export api
String.prototype.hash=function hash(){
  var h=0,i,char;
  if (this.length===0){
    return h;
  }
  
  for (i=0;i<this.length;i++){
    char=this.charCodeAt(i);
    h=((h<<5)-h)+char;
    h=h & h;
  }
  return h;
}  	


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
    res.header('Access-Control-Allow-Credentials', config.cors.credentials);
    if(Array.isArray(config.cors.allowedDomains))config.cors.allowedDomains.forEach(function(domain){
      res.header('Access-Control-Allow-Origin', domain);
    });
    res.header('Access-Control-Max-Age', config.cors.age);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if( req.method.toLowerCase() === "options" ) {
        return res.send( 200 );
    }
    next();
}


// config
// TODO check error handling options http://expressjs.com/guide.html#error-handling
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
  app.use(CORS);  
  
  
  app.use(express.cookieParser());
  app.use(express.static('public'));
  app.locals.pretty = true;
	app.use(function(req,res,next){
	  if(!req.cookies.token && false){
	    
	    var t=token(16);
	    res.cookie('token', t);
	    res.header('token', t);
	    
    	console.log(t)
	  }
	  next();
	})

});



require('./mail')(app);
require('./models')(app, express);
require('./controllers')(app);

