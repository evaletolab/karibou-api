
module.exports = function(app) {

	var mongoose = require('mongoose');
	var mongooseAuth = require('mongoose-auth');
	var everyauth = require('everyauth')
		, Promise = everyauth.Promise;

	everyauth.debug = true;

	// connect to Mongo when the app initializes
	mongoose.connect(config.mongo);


	require('./users');
	require('./products');

	app.configure(function () {
		app.use(mongooseAuth.middleware());
	});

};
