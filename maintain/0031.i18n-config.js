

exports.execute = function(db, script, callback){
	console.log(script,"Convert all configs for i18n");
  var logs="", count=0;
  var configs=db.collection('configs');

  configs.find( {}).toArray(function (err,p) {
	  if (!p.length){
	    return callback(null, "0 conf have been updated")
	  }
    console.log(script,"migrating "+p.length +" configs");
	  require('async').each(p, function(conf, eachcb){

      //
      // convert maintenance.reason
      if(!conf.maintenance.reason||!conf.maintenance.reason.fr){
        conf.maintenance.reason={fr:conf.maintenance.reason};
      }

      //
      // convert noshipping
      for (var i = conf.noshipping.length - 1; i >= 0; i--) {
        if(conf.noshipping[i].reason&&!conf.noshipping[i].reason.fr){
          conf.noshipping[i].reason={fr:conf.noshipping[i].reason};
        }
      };
      
      if(!conf.menu){
        conf.menu=[];
      }

      if(!conf.home){
        conf.home={};  
      }

      conf.home.views=[];
      conf.home.siteName={};
      conf.home.tagLine={h:{},p:{}};
      conf.home.about={h:{},p:{}};
      conf.home.footer={h:{},p:{}};


      configs.save(conf,function(err){
        console.log(err, conf.slug)
        eachcb(err);        
      });
	  },
	  function(err){
        return callback(err, p.length+" configs have been updated");
	  });
  });	
	
}
