

//var pkgname = require('../package').name;
var debug = require('debug')('config');

try {

  var env = (process.env.NODE_ENV || 'development')
	  , path = require('path')
  	  , rootPath = path.normalize(__dirname + '/..')  

  // try load environment specific config
  var env_config_name = '../config-' + env;
  global.config=module.exports = require(env_config_name);
  global.config.root=rootPath
  
  debug('environment: ' + env);
  
} catch (err) {
  throw new Error('Config: Failed to load \'' + env_config_name + '\': ' + err);
}
