

//var pkgname = require('../package').name;
var debug = require('debug')('config');

try {

  var env = (process.env.NODE_ENV || 'development');

  // try load environment specific config
  var env_config_name = '../config-' + env;
  module.exports = require(env_config_name);
  debug('environment: ' + env);

} catch (err) {
  throw new Error('Config: Failed to load \'' + env_config_name + '\': ' + err);
}
