/**
 * Maintain mongo database
 * http://docs.mongodb.org/manual/reference/operator/#AdvancedQueries-%24type
 * 
 * 
 * find all shop.options and rename it to shop.details 
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
 * $type:
 *    Double	1, String	2, Object	3, Array	4, Binary data	5, 
 *    Undefined (deprecated)	6, Object id	7, Boolean	8, Date	9, 
 *    Null	10, Regular Expression	11, JavaScript	13, 
 *    Symbol	14, JavaScript (with scope)	15, 
 *    32-bit integer	16, Timestamp	17, 64-bit integer	18, Min key	255, Max key	127
 *    
 */


exports.execute = function(db, script, callback){
  var logs="", count=0;
  var users=db.collection('users');
  callback(null,"nothing todo")
  // users.find( {'address.location':{$type:3 } }).toArray(function (err,s) {
	 //  if (!s.length){
	 //    return callback(null, "0 shop have been updated")
	 //  }
  //   console.log(script,"migrating "+s.length +" users");
  //   users.update({}, { $rename: { "address.location": "address.geo" } } ,function(err){
  //     callback(err, s.length+" users have been updated");
  //   })

  // });	
	
}
