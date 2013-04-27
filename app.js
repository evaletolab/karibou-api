//
// check links
// https://github.com/datapimp/backbone-express-mongoose-socketio
// mongo/express sample 
// https://gist.github.com/1025038
// dynamic helpers
// http://stackoverflow.com/questions/6331776/accessing-express-js-req-or-session-from-jade-template
// http://stackoverflow.com/questions/11580796/migrating-express-js-2-to-3-specifically-app-dynamichelpers-to-app-locals-use


//var pkgname = require('./package').name;

var debug = require('debug')('app');
var app = require('./app/index');

 // update the db if necessary
require('./app/db.maintain').update();

// launch server
var port = (process.env.VMC_APP_PORT || process.env.C9_PORT || config.express.port);
var host = (process.env.VMC_APP_HOST || 'localhost');

// manage c9 env
if (process.env.C9_PORT ){
    host='0.0.0.0';
}

app.listen(port);






