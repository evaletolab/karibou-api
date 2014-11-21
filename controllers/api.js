
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    sm = require('sitemap'),
    errorHelper = require('mongoose-error-helper').errorHelper;
    origins=[]

//
// authorized origins
function btoa(str){
  return new Buffer(str).toString('base64')
}

config.cors.allowedDomains.forEach(function(origin){
  origins.push(btoa(origin))
})

exports.index = function(app){
  return function(req, res) {
    var model={ 
      api: app.routes, 
      user: req.user, 
      filter:function(api){
        return _.filter(api, function(route){return route.path.indexOf("/v1")>-1;});
      } 
    };
    res.render('home',  model);
  }
};




exports.config = function(req, res) {
    //
    // admin you get server env
    if (req.user&&req.user.isAdmin()) { 
      config.shop.env=process.env;
    }
    res.json(config.shop);
};



exports.trace = function(req, res) {
    if(origins.indexOf(req.params.key)==-1){
      return res.send(401,"invalid token")
    }
    bus.emit('trace.error',req.params.key,req.body);

    if(req.body.stacktrace&&req.body.stacktrace.frames.length){
      var len=req.body.stacktrace.frames.length
      console.log("ERROR[UI]",
        req.body.message,
        req.body.request.headers, 
        req.body.request.url, 
        req.body.site, 
        req.body.stacktrace.frames[len-1].pre_context)
    }
    res.json({});
};


exports.message = function(req, res) {
    if(origins.indexOf(req.params.key)==-1){
      // return res.send(401,"invalid token")
    }
    bus.emit('system.message',"[kariboo-subscribe] : ",req.body);

    res.json({});
};



exports.sitemap=function(req,res){
  var sitemap;

  // if sitemap is cached
  if (sitemap && sitemap.isCacheValid()){
    return sitemap.toXML( function (xml) {
        res.header('Content-Type', 'application/xml');
        res.send( xml );
    });    
  }

  // else
  require('mongoose').model('Products').findByCriteria({'query.status':true},function(err,products){
    if(err){
      return req.send(400,errorHelper(err))
    }
    var prefix="/products/";
    var urls=[];
    products.forEach(function(product){
      // use lastmod wit product update date ??
      urls.push({url:prefix+product.sku, changefreq: 'weekly', priority: 1.0 })
    })

    sitemap = sm.createSitemap ({
      hostname: 'http://karibou.ch',
      cacheTime: (12*3600000),        // 12h - cache purge period
      urls: urls
    });

    sitemap.toXML( function (xml) {
        res.header('Content-Type', 'application/xml');
        res.send( xml );
    });    

  })
}

exports.robots=function(req,res){
  res.send(400,'not implemented')
}


exports.github=function(req,res){
  function verify(key, str) {
    return 'sha1=' + require('crypto').createHmac('sha1', key).update(str).digest('hex')
  }

  var  sig   = req.headers['x-hub-signature']
      ,event = req.headers['x-github-event']
      ,id    = req.headers['x-github-delivery']  

  if(!sig||!event||!id){
    //ERROR
  }

  //if (feedback.ref.match('master')) {
  //}
  //exec('bash -x /path/install.sh', function (error, stdout, stderr) {

  console.log("github ----------------",sig,id,event,req.body)

  bus.emit('github.push',req.body);
}