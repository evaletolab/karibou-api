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
	console.log(script,"Convert all products.photo.url to uploadcare");
  var logs="", count=0;
  var products=db.collection('products');
  var uploadcare=require('./includes/uploadcare')(config.auth.uploadcare.pub, config.auth.uploadcare.pk)

  products.find( {}).toArray(function (err,p) {
	  if (!p.length){
	    return callback(null, "0 product have been updated")
	  }
    console.log(script,"migrating "+p.length +" products");
	  
    //
    // convert url
    require('async').each(p, function(product, eachcb){
      // 
      if(!product.photo||!product.photo.url){
        console.log('WARNING no photo available for product',product.sku)
        return eachcb();        
      }
      if(product.photo.url){
        uploadcare.file.fromUrl(product.photo.url, function(err,res){
          if(err){return eachcb(err)}
          product.photo.url='//ucarecdn.com/'+res.uuid+'/';

          products.save(product,function(err){
            console.log('renamed',product.photo.url )
            eachcb(err);        
          });

        });
      }

	  },
	  function(err){
        return callback(err, p.length+" photos on products have been updated");
	  });
  });	
	
}
