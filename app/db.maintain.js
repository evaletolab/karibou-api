var fs = require('fs');
var mongoose = require("mongoose");
var DbMaintain = mongoose.model('DbMaintain');
var async     = require("async");


/**
 * Maintain mongo database
 * http://docs.mongodb.org/manual/reference/operator/#AdvancedQueries-%24type
 *
 * Use case
 * 1) How to change the type of a field?
 *    see type here http://docs.mongodb.org/manual/reference/operator/type/#op._S_type
 *  db.foo.find( { 'bad' : { $type : 1 } } ).forEach( function (x) {   
 *   x.bad = new String(x.bad); // convert field to string
 *   db.foo.save(x);
 *  });
 *
 * 2) How to rename a field
 *    db.students.update( { _id: 1 }, { $rename: { "name.first": "name.fname" } } )
 *    db.students.update( { _id: 1 }, { $rename: { "name.last": "contact.lname" } } )
 *
 *
 */


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

