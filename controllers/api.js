
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    sm = require('sitemap'),
    db = require('mongoose'),
    payment = require('../app/payment'),
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
  if (req.user&&req.user.isAdmin()) { 
    //config.shop.env=process.env;
  }
  res.json(config.shop);
};


exports.saveConfig = function(req, res) {
  db.model('Config').saveMain(req.body,function(err,conf) {
    res.json(config.shop);
  })
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



exports.sessions = function(req, res) {
  require('mongoose').connection.db.collection('sessions',function(err,sessions){
    if(err){
      return res.send(400,errorHelper(err))
    }
    sessions.find({}).toArray(function(err,sess){
      if(err){
        return res.send(400,errorHelper(err))
      }
      return res.json(sess)
    })
  })
}

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
      hostname: config.mail.origin,
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
  res.type('text/plain');
  res.send(200,'User-agent: *\nDisallow: /\n');
}


exports.github=function(req,res){
  var spawn = require('child_process').spawn;

  //
  // github sig
  function verify(key, body) {
    var str=JSON.stringify(body);
    return 'sha1=' + require('crypto').createHmac('sha1', key).update(str).digest('hex')
  }


  //
  // checks webhook config 
  if(!config.admin.webhook||!config.admin.webhook.secret){
    return res.send(400)
  }

  //
  // checks push release
  if(req.body.ref.indexOf(config.admin.webhook.release)===-1){
    return res.send(400)    
  }

  //
  // checks github posting params
  var  sig   = req.headers['x-hub-signature']
      ,event = req.headers['x-github-event']
      ,id    = req.headers['x-github-delivery']  
      ,verify= verify(config.admin.webhook.secret,req.body)


  if(!sig||!event||!id){
    return res.send(400)
  }

  if(sig!==verify){
    console.log('gihub sig verification error',sig,verify)
    return res.send(400,'sig verification error')
  }

  if (req.body.ref.indexOf(config.admin.webhook.release)===-1) {
    return res.send(200)
  }

  var child=spawn('node-continuous.sh',[config.admin.webhook.release,config.express.port],{detached:true})
  child.stdout.on('data', function (stdout) {
    console.log("github",event,stdout.toString('utf8'))    
  })

  child.stderr.on('data', function (error) {
    console.log(error.toString('utf8'))
    //return bus.emit('system.message',"[karibou-github error] : ",error.toString('utf8'));
  });
}


//
// PSP callback /v1/psp/:token/webhook
exports.psp=function(req,res){

  //
  // checks webhook config 
  if(!config.admin.webhook||!config.admin.webhook.secret){
    return res.send(400)
  }

  //
  // check webhook secret
  if(config.admin.webhook.secret!==req.params.token){
    return res.send(400,'PSP token verification error')
  }

  if(!payment.for(req.body.BRAND).isValidSha(req.body)){
    return res.send(400,"The calculated hash values and the transmitted hash values do not coincide.")
  }

  db.model('Users').findOne({'payments.$.alias':req.body.ALIAS},function (err,user) {
    if(err){
      return res.send(400,errorHelper(err))
    }

  })

  res.render('pspsuccess');
}

//
// PSP append alias in user.payment[] 
exports.pspForm=function(req,res){
  payment.for('postfinance card').ecommerceForm(req.user,function (err, card, form) {
    if(err){
      return res.send(400,errorHelper(err))
    }

    // for security reason alias is crypted
    var alias=(req.user.id+card.issuer.toLowerCase()).hash(), safePayment={}
    console.log('-------------------->',form, alias)
    // safePayment.alias=alias;
    // safePayment.type=card.issuer.toLowerCase();
    // safePayment.name=form.CN;
    // safePayment.updated=Date.now();


    // if(!req.user.payments) req.user.payments=[]

    // for (var i in req.user.payments){
    //   if(req.user.payments[i].alias===safePayment.alias||
    //      req.user.payments[i].alias===safePayment.alias.crypt()){
    //     return  res.json(form)
    //   }
    // }
    // req.user.payments.push(safePayment)
    // req.user.save(function (err,user) {
    //   res.json(form)
    // })
    res.json(form)


  })
}


//
// empty PSP template 
exports.pspStd=function(req,res){
  res.render('pspstd');
}
