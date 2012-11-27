//
// check links
// https://github.com/datapimp/backbone-express-mongoose-socketio
// mongo/express sample 
// https://gist.github.com/1025038
// dynamic helpers
// http://stackoverflow.com/questions/6331776/accessing-express-js-req-or-session-from-jade-template
// http://stackoverflow.com/questions/11580796/migrating-express-js-2-to-3-specifically-app-dynamichelpers-to-app-locals-use

 

var pkgname = require('./package').name;
var debug = require('debug')('app');
var app = require('./app/index');



// launch server

app.listen(3000);

