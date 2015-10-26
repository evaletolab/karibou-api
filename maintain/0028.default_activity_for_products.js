/**
 * Maintain mongo database
 *    
 */


exports.execute = function(db, script, callback){
	console.log(script,"Init activity for all products");
  var logs="", count=0;
  var products=db.collection('products'), activity=db.collection('activities');

  products.find( {}).toArray(function (err,p) {
	  if (!p.length){
	    return callback(null, "0 product have been updated")
	  }
    console.log(script,"activities for "+p.length +" products");
	  require('async').each(p, function(product, eachcb){

	    var doc={
        who:{id:1,email:'evaleto@gmail.com',name:'system'},
        what:{type:'Products',key:'sku',id:product.sku+'',action:'create'},
        content:{pricing:product.pricing,title:product.title},
        when:new Date()
      };
      activity.save(doc,function(err){
        if(err){
          console.log('ERROR',product.sku,err)
        }
        eachcb(err);        
      });

	  },
	  function(err){
        return callback(err, p.length+" activities have been created");
	  });
  });	
	
}
