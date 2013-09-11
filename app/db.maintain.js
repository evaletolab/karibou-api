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
	var scripts = fs.readdirSync('./db_maintain');

	var versionDone;


  db.collection('dbmaintains').find().sort({version:-1}).toArray(function(err, versionColl){
	  if(err){
	    return callback(err);
	  }

    versionDone = (versionColl[0])?(versionColl[0].version):(0);    
    var logs=[];		
    console.log("version --------------------",versionDone);


    for (var i in scripts){
      var script=scripts[i];


		  //
		  // get version of the script
		  var versionScript = parseInt(script.match(new RegExp(/.+_(\d+).+/))[1]);

      //
			// continue if there are no more recent scripts
			if(versionDone >= versionScript){
        console.log("skeeping script ", script)
			  continue;
			}
			versionDone++;
      console.log("loading script ", script)

	    require('../db_maintain/' + script).execute(db, function(err, log){							
	      //
        // not save on error		    
	      if(err){
	        return eachcb(err);				        
	      }
        db.collection('products').find().toArray(function(err, p){
          console.log(err,p)
        });

      });

    }
  });
/**
    require('async').forEach(scripts, function(script, eachcb){
    
    db.collection('products').find().toArray(function(err, p){
      console.log(err,p)
    });
    
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
//		    DbMaintain.save({version: versionScript, log: log}, function(err, log){
//          logs.push(log);
//          eachcb(err);				        
//		    });
	    });
    
    },function(err){
      callback(err, logs);
    });      
  });
  **/
/**

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
*/
};

