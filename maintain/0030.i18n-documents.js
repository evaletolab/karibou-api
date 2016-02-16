

exports.execute = function(db, script, callback){
	console.log(script,"Convert all documents for i18n");
  var logs="", count=0;
  var documents=db.collection('documents');

  documents.find( {}).toArray(function (err,p) {
	  if (!p.length){
	    return callback(null, "0 doc have been updated")
	  }
    console.log(script,"migrating "+p.length +" documents");
	  require('async').each(p, function(doc, eachcb){

      //
      // convert title
      if(!doc.title.fr)doc.title={fr:doc.title};

      //
      // convert content
      if(!doc.content.fr)doc.content={fr:doc.content};

      //
      // convert header
      if(!doc.header.fr)doc.header={fr:doc.header};

      //
      // convert slug
      if(!Array.isArray(doc.slug)&&doc.slug)doc.slug=[doc.slug];

      documents.save(doc,function(err){
        console.log(err, doc.slug)
        eachcb(err);        
      });
	  },
	  function(err){
        return callback(err, p.length+" documents have been updated");
	  });
  });	
	
}
