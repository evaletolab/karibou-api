

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
  if(env==='production'){
    config = '../config-production';
  }else{
    config = '../config/config-' + env;
  }

  //
  // make the configuration visible  
  global.config= require(config);
  global.config.root=rootPath;
  global.config.shared=require('../config/config-shared'+test);

  module.exports=global.config;
  
  debug('environment: ' + env);
} catch (err) {
  throw new Error('Config: Failed to load \'' + config + '\': ' + err);
}
