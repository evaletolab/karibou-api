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
	console.log(script,"Convert all shops images to uploadcare");
  var logs="", count=0;
  var shops=db.collection('shops');
  var uploadcare=require('./includes/uploadcare')(config.auth.uploadcare.pub, config.auth.uploadcare.pk)

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
      var series=[];

      if(shop.photo.owner){
        series.push(function (seriescb) {
          console.log('upload ow',shop.photo.owner)
          uploadcare.file.fromUrl(shop.photo.owner, function(err,res){
            if(err){return seriescb(err)}
            shop.photo.owner='//ucarecdn.com/'+res.uuid+'/';
            seriescb();
          });
        });
      }

      if(shop.photo.bg){
        series.push(function (seriescb) {
          console.log('upload bg',shop.photo.bg)
          uploadcare.file.fromUrl(shop.photo.bg, function(err,res){
            if(err){return seriescb(err)}
            shop.photo.bg='//ucarecdn.com/'+res.uuid+'/';
            seriescb();                  
          });
        });
      }

      if(shop.photo.fg){
        series.push(function (seriescb) {
          console.log('upload fg',shop.photo.fg)
          uploadcare.file.fromUrl(shop.photo.fg, function(err,res){
            if(err){return seriescb(err)}
            shop.photo.fg='//ucarecdn.com/'+res.uuid+'/';
            seriescb();
          });
        });

      }
      require('async').series(series,
      function(err, results){
        if(err){return eachcb(err);}        
        shops.save(shop,function(err){
          console.log('renamed ',shop.photo )
          eachcb(err);        
        });
      });
      

	  },
	  function(err){
        return callback(err, lst.length+" photos on shops have been updated");
	  });
  });	
	
}
