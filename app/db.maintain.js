var fs = require('fs');

exports.update = function(app){
	var mongo_scripts = fs.readdirSync('./maintain');

	mongo_scripts.forEach(function(script, cb){
		require('../maintain/' + script).execute(function(err, log){
			console.log("call " + script);
		});

	});

};