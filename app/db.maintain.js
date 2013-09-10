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


exports.update = function(db, callback){
	// get sync list of scripts
	var scripts = fs.readdirSync('./db_maintain');

	var versionDone;



	// current version in db
	DbMaintain.findLatestVersion(function(err, ver){
	
	  if(err){
	    return callback(err);
	  }
		versionDone = ver;
    var logs=[];		


    require('async').forEach(scripts, function(script, eachcb){
		  //
		  // get version of the script
		  var versionScript = parseInt(script.match(new RegExp(/.+_(\d+).+/))[1]);

      //
			// continue if there are no more recent scripts
			if(versionDone >= versionScript){
        console.log("skeeping script ", script)
			  return eachcb();
			}
			versionDone++;
      console.log("loading script ", script)
      
      
	    require('../db_maintain/' + script).execute(db, function(err, log){							
	      //
        // not save on error		    
	      if(err){
	        return eachcb(err);				        
	      }
		    // save script-info in db
		    DbMaintain.save({version: versionScript, log: log}, function(err, log){
          logs.push(log);
          eachcb(err);				        
		    });
	    });
    
    },function(err){
      callback(err, logs);
    });        
    
	});

};

