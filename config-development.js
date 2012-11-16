
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {

  express: {
    port: process.env.PORT || 3000,
    views: PATH('views'),
    'view engine': 'jade'
  },

  

};
