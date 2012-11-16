
var pkgname = require('./package').name;
var debug = require('debug')('app');
var app = require('./app/index');



// launch server

app.listen(3000);
