var fs = require('fs');
var mongoose = require("mongoose");
var DbMaintain = mongoose.model('DbMaintain');
var async     = require("async");


exports.update = function(app){
	// get async list of scripts
	var mongo_scripts = fs.readdirSync('./db_maintain');

	var versionDone;

			// current version in db
			DbMaintain.findLatestVersion(function(err, ver){
			versionDone = ver;

			mongo_scripts.forEach(function(script, callback){
				// version of the script
				var versionScript = parseInt(script.match(new RegExp(/.+_(\d+).+/))[1]);

					// update if there are more recent scripts
					if(versionDone < versionScript){
						versionDone ++;

						async.waterfall([
						function(cb){			
							// execute the scripts in db_maintain
							require('../db_maintain/' + script).execute(function(err, log){							
								return cb(err, log);
							})
						},
						function(logMessage, cb){
							// save script-info in db
							DbMaintain.save({version: versionScript, log: logMessage}, function(err, log){
								return cb(err, log);
							})
						},
						],
						function(cb){
							return cb;
						});
					}
					return callback;
				});
				return err, ver;
			});

};

