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
  var shops=db.collection('shops');

  shops.find({}).toArray(function (err,lst) {
	  if (!lst.length){
	    return callback(null, "0 product have been updated")
	  }
    console.log(script,"migrating "+lst.length +" shops");
	  
    //
    // convert url
    require('async').each(lst, function(shop, eachcb){
      // 
      if(!shop.photo){
        console.log('WARNING no photo available for shop ',shop.name)
        return eachcb();        
      }
      if(shop.photo.owner) var owner=shop.photo.owner.split(aws.in);
      if(shop.photo.bg)    var bg=shop.photo.bg.split(aws.in);
      if(shop.photo.fg)    var fg=shop.photo.fg.split(aws.in);
      
      if(owner&&owner.length>1){  shop.photo.owner=aws.out+owner[1]; }
      if(bg&&bg.length>1){        shop.photo.bg=aws.out+bg[1]; }
      if(fg&&fg.length>1){        shop.photo.fg=aws.out+fg[1]; }
      console.log('rename ',shop.photo )
      shops.save(shop,function(err){
        eachcb(err);        
      });

	  },
	  function(err){
        return callback(err, lst.length+" photos on shops have been updated");
	  });
  });	
	
}
