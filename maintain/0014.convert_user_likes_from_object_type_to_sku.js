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


exports.execute = function(db, script, callback){
	console.log(script,"Convert all user likes from Product Object to SKU number");
  var logs="", count=0,mapping={};
  var Products=db.collection('products');
  var Users=db.collection('users');
  var tosave=false, errs=[],logs=[];

  // find all
  db.collection('products').find({}).toArray(function (err,products) {
    products.forEach(function (product) {
      mapping[product._id]=product.sku
    })

    // object id == 7
    Users.find( {"likes":{$type:7}}).toArray(function (err,users) {
      if (!users.length){
        return callback(null, "0 user have been updated")
      }
      if(err){
        errs.push(err)
      }
      console.log(script,"updating users likes: "+users.length );

      users.forEach(function(user){
        var likes=[];
        user.likes.forEach(function (like) {
          likes.push(mapping[like]);
        });
        // update data
        user.likes=likes;

        if(user.email)console.log('find:',user.email.address,user.likes);
        else console.log('find:',user.id,user.likes);
        Users.update({id:user.id},user,function (err) {
            if(err)errs.push(err);
        })
      })

      callback(errs.join(','), users.length+" users likes have been updated");

    }); 

  });



}
