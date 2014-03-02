

//var pkgname = require('../package').name;
var debug = require('debug')('config');

try {
  var _= require('underscore')
    , env = (process.env.NODE_ENV || 'development')
	  , path = require('path')
  	, rootPath = path.normalize(__dirname + '/..')  
  	, config
    , test=(env==='test')?'-test':''

  // try load environment specific config
  config = '../config/config-' + env;
  global.config= require(config);

  config = '../config/config-shop'+test;
  global.config=_.extend(global.config,{root:rootPath},require(config))
  module.exports=global.config;
  
  debug('environment: ' + env);
  
} catch (err) {
  throw new Error('Config: Failed to load \'' + config + '\': ' + err);
}
