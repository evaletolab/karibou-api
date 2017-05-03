
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
    errorHelper = require('mongoose-error-helper').errorHelper,
    origins=[];

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
    // route introspection has changed since express 4.0
    // see http://stackoverflow.com/questions/14934452/how-to-get-all-registered-routes-in-express
    // based on app._router.stack
    var model={ 
      api: app.mountpath, 
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
    //config.shared.env=process.env;
  }
  config.shared.shippingweek=Date.fullWeekShippingDays();
  res.json(config.shared);
};


exports.saveConfig = function(req, res) {
  var lang=req.session.lang||config.shared.i18n.defaultLocale;
  try{
    validate.config(req.body,lang);
  }catch(err){
    return res.status(400).send(err.message);
  }

  db.model('Config').saveMain(req.body,function(err,conf) {
    res.json(config.shared);
  })
};




exports.trace = function(req, res) {
    if(origins.indexOf(req.params.key)==-1){
      return res.status(401).send("invalid token")
    }
    bus.emit('trace.error',req.params.key,req.body);
    res.json({});
};


exports.message = function(req, res) {
    if(origins.indexOf(req.params.key)==-1){
      // return res.status(401).send("invalid token")
    }
    var mail={
      title:"[karibou-subscribe] : "
    };
    if(req.params.subject){
      if(config.mailing[req.params.subject]){
        mail=config.mailing[req.params.subject];
      }else{
        mail=config.mailing.others;
      }
    }

    if(mail.mailchimp){
      var mailchimpvars = {
        id:mail.mailchimp,
        email: req.body.email,
        fname: req.body.fname,
        lname: req.body.lname,
        tags:{
          MMERGE3:req.params.subject
        }
      };
      //
      // try to subscribe this new account
      bus.emit('mailchimp.subscribe',mailchimpvars,function (err,data) {
        console.log('DEBUG------- subscribe',err,data,mailchimpvars)
      });
    }

    bus.emit('system.message',mail.title,req.body);

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
    return res.status(400).send(err.message);
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
    return bus.emit('sendmail',{to:config.mail.info,from:content.email},
                 "Un utilisateur a une question pour Karibou.ch ",
                 content,
                 "karibou-question", function(err, status){
      if(err){
        return res.status(400).send(errorHelper(err));
      }

      res.json(content);
    })

  }

  //
  // send email @shop
  db.model('Shops').findOne({urlpath:req.body.shopname}).populate('owner').exec(function(err,shop){
    if (err){
      return res.status(400).send(errorHelper(err));
    }
    if(!shop){
      return res.status(400).send("Cette boutique n'existe pas");
    }

    //
    //

    //
    // send email
    var address={from:content.email,to:shop.owner.email.address};
    if(shop.owner.email.cc){
      address.cc=shop.owner.email.cc;
    }


    bus.emit('sendmail',address,
                 "Un utilisateur à une question pour votre boutique "+shop.name,
                 content,
                 "karibou-question", function(err, status){
      if(err){
        return res.status(400).send(errorHelper(err));
      }

      res.json(content);
    })

  });
}

exports.activities=function (req,res) {
  var now=new Date(), 
      criteria={
        month:req.query.month||(now.getMonth()+1),
        year:req.query.year,
        email:req.query.email,
        uid:req.query.uid,
        what:req.query.what
      };

  if(!req.user.isAdmin()){
    criteria.uid=req.user.id;
  }

  db.model('Activities').findByCrireria(criteria,function (err,activities) {
    if(err){
      return res.status(400).send(errorHelper(err))
    }
    res.json(activities);
  })
}


exports.sessions = function(req, res) {
  require('mongoose').connection.db.collection('sessions',function(err,sessions){
    if(err){
      return res.status(400).send(errorHelper(err))
    }
    sessions.find({}).toArray(function(err,sess){
      if(err){
        return res.status(400).send(errorHelper(err))
      }
      return res.json(sess)
    })
  })
}

exports.sitemap=function(req,res){
  var sitemap;

  // if sitemap is cached

  // else
  require('mongoose').model('Products').findByCriteria({'query.status':true,'available':true},function(err,products){
    if(err){
      return req.status(400).send(errorHelper(err))
    }
    var prefix="/products/";
    var urls=[], lastm;
    products.forEach(function(product){
      // use lastmod wit product update date ??
      lastm=new Date(product.updated)
      urls.push({url:prefix+product.sku, changefreq: 'daily', lastmod: lastm.toLocaleDateString(), priority: 1.0 })
    })

    //
    // yeah, google bot doesn't like 301 permanent redirection
    sitemap = sm.createSitemap ({
      hostname: config.mail.origin.replace('https','http'),
      cacheTime: (12*3600000),        // 12h - cache purge period
      urls: urls
    });

    res.header('Content-Type', 'application/xml');
    res.send( sitemap.toString() );
    // sitemap.toXML( function (xml) {
    //     res.header('Content-Type', 'application/xml');
    //     res.send( xml );
    // });    

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
  res.status(200).send(rb);
}


exports.github=function(req,res){
  var spawn = require('child_process').spawn;

  //
  // github sig
  function verify_hook(key, body) {
    var str=JSON.stringify(body);
    return 'sha1=' + require('crypto').createHmac('sha1', key).update(str).digest('hex')
  }


  //
  // checks webhook config 
  if(!config.admin.webhook||!config.admin.webhook.secret){
    return res.status(400).send('CI error (1)')
  }

  //
  // checks push release
  if(req.body.ref.indexOf(config.admin.webhook.release)===-1){
    return res.status(400).send('CI error (2)')    
  }

  //
  // checks github posting params
  var  sig   = req.headers['x-hub-signature']
      ,event = req.headers['x-github-event']
      ,id    = req.headers['x-github-delivery']  
      ,verify= verify_hook(config.admin.webhook.secret,req.body)


  if(!sig||!event||!id){
    return res.status(400).send('CI error (3)')
  }

  if(sig!==verify){
    console.log('gihub sig verification error',sig,verify)
    return res.status(400).send('CI verification error')
  }

  if (req.body.ref.indexOf(config.admin.webhook.release)===-1) {
    return res.sendStatus(200)
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
  return res.sendStatus(200)
}

