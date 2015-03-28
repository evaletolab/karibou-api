
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    sm = require('sitemap'),
    db = require('mongoose'),
    http = require('http'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    debug = require('debug')('api'),
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


// 
// proxy image from cdn
exports.imagecdn =function(req, res) {

    // cdn url format
    // http://cdn.filter.to/75x75/http://yoursite.com/path/to/my/picture.jpg
    // 375x1000/?uri=http://karibou-filepicker.s3-website-eu-west-1.amazonaws.com/Y8sMyOkzRvWgRwb0mBBJ_entrecote.jpg
    // var source='http://karibou-filepicker.s3-website-eu-west-1.amazonaws.com/';
    // var source="//s3-eu-west-1.amazonaws.com/karibou-filepicker/";
    var source=encodeURI(req.query.source);
    if(source.indexOf('http:')!==0){
      source='http:'+source;
    }
    var size=req.params.size+'/';
    var options = {
        host: "cdn.filter.to",
        path: "/"+size+source
    };

    var callback = function(response) {
        if (response.statusCode === 200) {
            res.writeHead(200, {
                'Content-Type': response.headers['content-type']
            });
            response.pipe(res);
        } else {
            res.writeHead(response.statusCode);
            res.end();
        }
    };

    http.request(options, callback).end();
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


//
// TODO multiple implement of send email, refactor it?
exports.email=function(req,res){
  try{
    validate.ifCheck(req.body.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 64).isSlug();
    validate.ifCheck(req.body.email,'Le format de l\'email n\'est pas valide').len(3, 164).isEmail();
    validate.ifCheck(req.body.content,"Le votre message n'est pas valide (entre 1 et 600 caractères)").len(1, 600).isText();
    validate.ifCheck(req.body.product,"Le nom du produit n'est pas valide (entre 1 et 200 caractères)").len(1, 200).isText();
    if(!req.user&&!req.body.email)throw new Error("Vous devez avoir une identité");
  }catch(err){
    return res.send(400, err.message);
  }

  var content={};
  content.user=req.user&&req.user.name.givenName||'Anonyme';
  content.email=req.body.email||req.user.email.address;
  content.text=req.body.text;
  content.subject=req.body.subject;
  content.product=req.body.product;
  content.withHtml=true;
  content.origin=req.header('Origin')||config.mail.origin;

  //
  // send email @karibou
  if(!req.body.shopname){
    content.mood=req.body.mood;
    return bus.emit('sendmail',config.mail.info,
                 "Un utilisateur à une question pour Karibou ",
                 content,
                 "karibou-question", function(err, status){
      if(err){
        return res.send(400,errorHelper(err));
      }

      res.json({});
    })

  }

  //
  // send email @shop
  db.model('Shops').findOne({urlpath:req.body.shopname}).populate('owner').exec(function(err,shop){
    if (err){
      return res.send(400,errorHelper(err));
    }
    if(!shop){
      return res.send(400,"Cette boutique n'existe pas");
    }

    //
    //

    //
    // send email
    bus.emit('sendmail',shop.owner.email.address,
                 "Un utilisateur à une question pour votre boutique "+shop.name,
                 content,
                 "karibou-question", function(err, status){
      if(err){
        return res.send(400,errorHelper(err));
      }

      res.json({});
    })

  });
}


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

    //
    // yeah, google bot doesn't like 301 permanent redirection
    sitemap = sm.createSitemap ({
      hostname: config.mail.origin.replace('https','http'),
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
  var rb='User-agent: *\n';
  // rb+="Disallow: /\n";
  rb+="Allow: /sitemap.xml\n";
  rb+="Allow: /shop\n";
  rb+="Allow: /products\n";
  rb+="Allow: /seo\n";
  rb+="Allow: /v1/config\n";
  rb+="Allow: /v1/products\n";
  rb+="Allow: /v1/category\n";
  rb+="Allow: /v1/cdn\n";
  rb+="Allow: /v1/shops\n";
  res.send(200,rb);
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
    return res.send(400,'CI error (1)')
  }

  //
  // checks push release
  if(req.body.ref.indexOf(config.admin.webhook.release)===-1){
    return res.send(400,'CI error (2)')    
  }

  //
  // checks github posting params
  var  sig   = req.headers['x-hub-signature']
      ,event = req.headers['x-github-event']
      ,id    = req.headers['x-github-delivery']  
      ,verify= verify(config.admin.webhook.secret,req.body)


  if(!sig||!event||!id){
    return res.send(400,'CI error (3)')
  }

  if(sig!==verify){
    console.log('gihub sig verification error',sig,verify)
    return res.send(400,'CI verification error')
  }

  if (req.body.ref.indexOf(config.admin.webhook.release)===-1) {
    return res.send(200)
  }

  console.log('============')
  console.log('= github CI',config.admin.webhook.release,config.express.port)
  console.log('============')
  var child=spawn('node-continuous.sh',[config.admin.webhook.release,config.express.port],{detached:true})
  child.stdout.on('data', function (stdout) {
    console.log("github",event,stdout.toString('utf8'))    
  })

  child.stderr.on('data', function (error) {
    console.log("end of CI",error.toString('utf8'))
  });

  // CI done
  return res.send(200)
}


//
// PSP callback /v1/psp/:token/webhook
// only used for online alias creation
// we can save POstfinance Card payment method one we get a valid webhook
// FIXME this should be in the postfinance module 
/*
exports.psp=function(req,res){

  //
  // checks webhook config 
  if(!config.admin.webhook||!config.admin.webhook.secret){
    return res.send(401);
  }

  //
  // check webhook secret
  if(config.admin.webhook.secret!==req.params.token){
    return res.send(401);
  }

  debug("webhook payload ",req.body);

  // check action is createAlias
  if(!req.body.createAlias ||!req.body.ALIAS){
    return res.send(200);
  }


  //
  // validate SHA
  if(!payment.for(req.body.BRAND).isValidSha(req.body)){
    return res.send(400,"The calculated hash values and the transmitted hash values do not coincide.");
  }

  var alias=(req.body.user+req.body.BRAND.toLowerCase()).hash(), safePayment={}
  var month=parseInt(req.body.ED.substring(0,2),10)
  var year=parseInt(req.body.ED.substring(2,4))+2000;
  safePayment.alias=req.body.ALIAS.crypt();
  safePayment.type=req.body.BRAND.toLowerCase();
  safePayment.name=req.body.CN;
  safePayment.number=req.body.CARDNO;
  safePayment.expiry=month+'/'+year;
  safePayment.updated=Date.now();


  Users.findOne({id: req.body.user}, function(err,user){
    if(err){
      return res.send(400,errorHelper(err))
    }
    if(!user){
      return res.send(400, "Utilisateur inconnu");
    }

    return user.addAndSavePayment(safePayment,function (err) {
      res.render('pspsuccess');
    })
  });



}

//
// PSP append alias in user.payment[] 
exports.pspForm=function(req,res){
  payment.for('postfinance card').ecommerceForm(req.user,function (err, card, form) {
    if(err){
      return res.send(400,errorHelper(err))
    }
    res.json(form)
  })
}


//
// empty PSP template 
exports.pspStd=function(req,res){
  res.render('pspstd');
}

*/