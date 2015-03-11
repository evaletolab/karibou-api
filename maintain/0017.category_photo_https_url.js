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

var aws={
      in:"//karibou-filepicker.s3-website-eu-west-1.amazonaws.com/",
      out:"//s3-eu-west-1.amazonaws.com/karibou-filepicker/"
    }; 

exports.execute = function(db, script, callback){
	console.log(script,"Convert all Category.image to be https complient");
  var logs="", count=0;
  var catgories=db.collection('categories');

  catgories.find( {}).toArray(function (err,cats) {
	  if (!cats.length){
	    return callback(null, "0 product have been updated")
	  }
    console.log(script,"migrating "+cats.length +" catgories");
	  
    //
    // convert url
    require('async').each(cats, function(category, eachcb){
      // 
      if(!category.cover){
        console.log('WARNING no photo available for category ',category.name)
        return eachcb();        
      }
	    var url=category.cover.split(aws.in);
      if(url.length>1){
        category.cover=aws.out+url[1]
      }
      console.log('rename ',category.cover )
      catgories.save(category,function(err){
        eachcb(err);        
      });

	  },
	  function(err){
        return callback(err, cats.length+" photos on catgories have been updated");
	  });
  });	
	
}
