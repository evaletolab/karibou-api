
/*
 * home
 */

var app=require('../app/config'),
    bus=require('../app/bus')
    _=require('underscore'),
    db = require('mongoose'),
    Shops = db.model('Shops'),
    validate = require('./validate/validate'),
    errorHelper = require('mongoose-error-helper').errorHelper,
    ObjectId = db.Types.ObjectId;


function isUserShopOwner(req){
  if(!req.user)return false;
  return (_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname}));
}

exports.ensureShopLimit=function(req, res, next) {
  if (!req.user.isAdmin() && req.user.shops.length>0){
    return res.status(401).send( "Vous ne pouvez plus ajouter de nouvelles boutiques");
  }
  return next();
}

exports.ensureOwnerOrAdmin=function(req, res, next) {

  //
  // ensure auth
	if (!req.isAuthenticated()) {
      return res.sendStatus(401);
	}

  // if admin, we've done here
  if (req.user.isAdmin())
    return next();

  //
  // ensure owner
	if(!isUserShopOwner(req)){
    return res.status(401).send( "Your are not the owner of this shop");
	}

  return next();

}




exports.create=function (req, res) {

  try{
    validate.shop(req.body);
  }catch(err){
    return res.status(400).send( err.message);
  }

  //
  // not valide user can't create shop
  if(req.user.email.status!==true){
    return res.status(400).send('Votre compte doit être validé pour pouvoir créer une boutique');
  }

  db.model('Shops').create(req.body, req.user, function(err,shop){
    if(err){
      return res.status(400).send(errorHelper(err.message||err));
    }

    //
    // log activity
    bus.emit('activity.create',req.user
                           ,{type:'Shops',key:'urlpath',id:shop.urlpath}
                           ,shop.getDiff());


    res.json(shop);
  });
};

exports.remove=function (req, res) {

  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();
  }catch(err){
    return res.status(400).send( err.message);
  }

  //
  // check admin or owner
  // delegated

  //
  // TODO remove products before shop

  db.model('Shops').remove({urlpath:req.params.shopname},function(err){
    if (err){
      return res.status(400).send(errorHelper(err));
    }
    return res.send(200);
  });
};


exports.get=function (req, res) {
  //
  // check shop owner
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();
  }catch(err){
    return res.status(400).send( err.message);
  }

  var query=Shops.findOneShop({urlpath:req.params.shopname});

  if(req.user&&req.user.isAdmin() || isUserShopOwner(req)){
    query.select('+account.fees');
  }

  query.exec(function (err,shop){
    if (err){
      return res.status(400).send(errorHelper(err));
    }

    if (!shop){
      return res.status(400).send("Cannot find the shop "+req.params.shopname);
    }

    return res.json(shop);
  });
};

//
// get for SEO
exports.getSEO=function (req, res) {
  var lang=req.session.lang||config.shared.i18n.defaultLocale;

  //
  // check shop owner
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();
  }catch(err){
    return res.status(400).send( err.message);
  }

  Shops.findOneShop({urlpath:req.params.shopname}).exec(function (err,shop){
    if (err){
      return res.status(400).send(errorHelper(err));
    }

    if (!shop){
      return res.status(400).send("Cannot find the shop "+req.params.shopname);
    }

    //
    // setup the model 
    var model={ 
      shop: shop, 
      user: req.user, 
      _:_,
      getLocal:function(item){
        if(item) return item[lang];return item;
      },
      weekdays:"Dimanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi".split(','),
      prependUrlImage:function (url) {
        if(url&&url.indexOf('//')===0){
          url='https:'+url;
        }
        return url;
      }
    };

    return res.render('shop', model);
  });
};


//
// get product SEO
exports.allSEO=function (req, res) {
  var lang=req.session.lang||config.shared.i18n.defaultLocale;

  var query={
    status:true
  }
  return db.model('Shops').find(query,function (err, shops) {
    if (err) {
      return res.status(400).send(errorHelper(err));
    }
    if(!shops.length){
      return res.status(400).send("Aucune boutique disponible");
    }

    //
    // get the list of cats
    db.model('Categories').find({},function (err,cats) {
      //
      // setup the model 
      var model={ 
        categories:cats,
        shops: shops, 
        user: req.user, 
        _:_,
        getLocal:function(item){
          if(item) return item[lang];return item;
        },
        weekdays:"Dimanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi".split(','),
        prependUrlImage:function (url) {
          if(url&&url.indexOf('//')===0){
            url='https:'+url;
          }
          return url;
        }
      };

      return res.render('shops', model);
    })
  });
};

//
// TODO multiple implement of send email, refactor it?
exports.email=function(req,res){
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 64).isSlug();
    if(req.user.email.status!==true)throw new Error("Vous devez avoir une adresse email valide");
    validate.check(req.body.content,"Le votre message n'est pas valide (entre 3 et 600 caractères)").len(3, 600).isText();
    if(!req.user)throw new Error("Vous devez avoir une session ouverte");
  }catch(err){
    return res.status(400).send( err.message);
  }


  db.model('Shops').findOne({urlpath:req.params.shopname}).populate('owner').exec(function(err,shop){
    if (err){
      return res.status(400).send(errorHelper(err));
    }
    if(!shop){
      return res.status(400).send("Cette boutique n'existe pas");
    }

    //
    //
    var content={};
    content.user=req.user;
    content.text=req.body.content;
    content.product=req.body.product;
    content.origin=req.header('Origin')||config.mail.origin;

    //
    // send email
    bus.emit('sendmail',shop.owner.email.address,
                 "Un utilisateur à une question pour votre boutique "+req.params.shopname,
                 content,
                 "shop-question", function(err, status){
      if(err){
        return res.status(400).send(errorHelper(err));
      }

      res.json(200);
    })

  });

}

exports.askStatus=function(req,res){
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();
    if(req.user.email.status!==true)throw new Error("Vous devez avoir une adresse email valide");
    if(!req.user)throw new Error("Vous devez avoir une session ouverte");
    //check(req.user.email.address, "Vous devez avoir une adresse email valide").len(3, 44).isEmail();
  }catch(err){
    return res.status(400).send( err.message);
  }
  db.model('Shops').findOne({urlpath:req.params.shopname},function(err,shop){
    if (err){
      return res.status(400).send(errorHelper(err));
    }
    if(!shop){
      return res.status(400).send("Cette boutique n'existe pas");
    }
    if ((typeof shop.status)==='number'){
      // check the time elapsed from the last askStatus
      var oneday=1000*60*60*24;
      var elapsed=Math.round((Date.now()-shop.status)/oneday);
      // max 1 mail by month
      console.log(elapsed,Date.now(),shop.status, Date.now()-shop.status,oneday)
      if (elapsed<config.mail.validate.time)
        return res.status(400).send("Une demande d'activiation est déjà en cours");
    }

    shop.status=Date.now();
    shop.save();

    var content=req.user;
    content.shop=shop;
    content.origin=req.header('Origin')||config.mail.origin;
    //
    // send email
    bus.emit('sendmail',config.mail.to,
                 "Demande de publication du shop "+shop.name,
                 content,
                 "shop-status", function(err, status){
      if(err){
        return res.status(400).send(errorHelper(err));
      }

      res.json(200,shop);
    })


  });

}

exports.status=function(req,res){

  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").isSlug().len(3, 34);
    if(req.body.status===undefined)throw new Error("Invalid request");;
  }catch(err){
    return res.status(400).send( err.message);
  }


  db.model('Shops').findOne({urlpath:req.params.shopname},function(err,shop){
    if (err){
      return res.status(400).send(err);
    }
    if(!shop){
      return res.status(400).send("Cannot find the shop");
    }
    shop.updateStatus(req.body.status,function(err){
      return res.json(shop);
    })
  });

};

exports.update=function(req,res){
  //
  // check && validate input field
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();
    validate.shop(req.body);
  }catch(err){
    return res.status(400).send( err.message);
  }

  //
  //quick body clean (avoid mongo warn !) 
  delete(req.body.urlpath);
  req.body.$promise && delete(req.body.$promise);
  req.body.$resolved && delete(req.body.$resolved);


  //
  // check for only admin updates

  //
  // with angular in UI we got some issue with the _id value
  function normalizeRef(field){
    return req.body[field]=(req.body[field]&&req.body[field]._id)?ObjectId(req.body[field]._id):ObjectId(req.body[field]);
  }
  req.body.catalog=normalizeRef('catalog');
  req.body.owner=normalizeRef('owner');




  Shops.findOne({urlpath:req.params.shopname}).select('+account.fees').exec(function(err,shop){
    if (err){
      return res.status(400).send(err);
    }

    if (!shop){
      return res.status(400).send('Ooops, unknow shop '+req.params.shopname);    
    }

    // if not admin silently fix   
    if(!req.user.isAdmin()){
      req.body.status=shop.status;
      req.body.account=shop.account;
    }

    //
    // log activity
    bus.emit('activity.update',req.user
                           ,{type:'Shops',key:'urlpath',id:shop.urlpath}
                           ,shop.getDiff(req.body));


    // do the update
    _.extend(shop,req.body)

    shop.save(function (err) {
      if (err){
        return res.status(400).send(err.message||errorHelper(err));    
      }
      return res.json(shop);  
    })
  });



};

exports.list=function (req, res) {
  //
  // check && validate input field
  try{
    validate.ifCheck(req.params.category, "Le format de la catégorie n'est pas valide").isSlug()
    validate.ifCheck(req.query.valid, "Le format de validation n'est pas valide").is(/^(true|false|yes|no)$/);
    validate.ifCheck(req.query.group, "Le format de groupe n'est pas valide").len(1, 34).is(/^[a-z0-9-.]+$/);
  }catch(err){
    return res.status(400).send( err.message);
  }

  var criteria=_.extend({},req.query);
  criteria.user=req.user;
  criteria.catalog=req.params.category;

  Shops.findByCriteria(criteria).then(function(shops) {
    return res.json(shops);
  }).then(undefined,function(err) {
      return res.status(400).send(err);
  });


};
