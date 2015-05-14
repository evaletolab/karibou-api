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
	console.log(script,"Add order.vendors business model default value of 15%");
  var logs="", count=0;
  var orders=db.collection('orders');

  orders.find({}).toArray(function (err,os) {
	  if (!os.length){
	    return callback(null, "0 order have been updated")
	  }
    console.log(script,"migrating "+os.length +" orders");
	  require('async').each(os, function(order, eachcb){

	  	//
	  	// update BM on for each vendors 
	  	order.vendors.forEach(function (vendor) {
	  		vendor.fees=0.15;
	  	})

      orders.save(order,function(err){
        eachcb(err);        
      });

	  },
	  function(err){
        return callback(err, os.length+" orders have been updated");
	  });
  });	

  // this is not possible, waiting for $$ operator 
  // see here https://jira.mongodb.org/browse/SERVER-1243
  // orders.update({'vendors.fees':{$ne:true}} , {$set: {"vendors.$$.fees": 0.15}},{multi:true}, function(err,count){
  //   callback(err, count+" orders have been updated");
  // })
	
}
