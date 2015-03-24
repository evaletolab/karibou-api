var fs = require('fs');
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


exports.update = function(db, callback){
	// get sync list of scripts
	var scripts = fs.readdirSync('./maintain');

	var versionDone;
	var maintain=db.collection('dbmaintains');

  	maintain.find().sort({version:-1}).toArray(function(err, versionColl){

		if(err){
			return callback(err);
		}

		versionDone = (versionColl[0])?(versionColl[0].version):(0);    
    	var logs=[];		


		require('async').eachSeries(scripts, function(script, eachcb){

			//
			// get version of the script
			var match=script.match(new RegExp(/(\d+)\..+/))
			if(!match||!match.length){
				return eachcb();
			}
			var versionScript = parseInt(match[1]);

			// continue if there are no more recent scripts
			if(versionDone >= versionScript){
				return eachcb();				        
			}

			versionDone++;

		    require('../maintain/' + script).execute(db, script, function(err, log){							
		    	//
		    	// not save on error		    
				if(err){
					return eachcb(script+" ERROR: "+err);				        
				}
				console.log(script,log)

				// save script-info in db
				maintain.save({version: versionScript, log: log}, function(err, log){
			      logs.push(log);
			      eachcb(err);				        
				});

		    });
	    },function(err){
	      callback(err, logs);
	    });      
	});

};

