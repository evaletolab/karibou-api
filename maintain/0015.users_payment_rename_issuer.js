/**
 * Maintain mongo database
 * http://docs.mongodb.org/manual/reference/operator/#AdvancedQueries-%24type
 * 
 * 
 *  find all product where photo is a string
 *   - convert the field photo:string => photo:{url:string}
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


// 
// {
//     "alias" : "8ff17caf9b429fa74d6f93a361fa2f8f44891e3ea22b41257857fdcf6be56caa0e0e0e0e",
//     "type" : "visa",
//     "name" : "oli evalet",
//     "number" : "40xxxxxxxxxx1881",
//     "csc" : "321",
//     "expiry" : "12/2015",
//     "updated" : 1413375339775
// }


exports.execute = function(db, script, callback){
	console.log(script,"Convert all user.payments.type => payments.issuer");
  var logs="", count=0;
  var Users=db.collection('users');
  var tosave=false, errs=[],logs=[];

	
  Users.find({'payments.type':{$exists:true}}).toArray(function (err,users) {
    if (!users.length){
      return callback(null, "0 users have been updated")
    }
    console.log(script,"updating payment issuer: "+users.length );

    for (var i = users.length - 1; i >= 0; i--) {
      users[i].payments.forEach(function (payment) {
        payment['issuer']=payment.type;
        delete payment.type;
      })
      Users.update({id:users[i].id},users[i],function (err) {
          if(err)errs.push(err);
      })
    };


    callback(errs.join(','), users.length+" users have been updated");

  }); 

}
