
/*
 * home
 */

var app=require('../app/config'),
    bus=require('../app/bus')
    _=require('underscore'),
    db = require('mongoose'),
    Shops = db.model('Shops'),
    validate = require('./validate/validate'),
    ObjectId = db.Types.ObjectId;



exports.ensureShopLimit=function(req, res, next) {
  if (!req.user.isAdmin() && req.user.shops.length>0){
    return res.send(401, "Vous ne pouvez plus ajouter de nouvelles boutiques"); 
  }
  return next(); 
}
    
exports.ensureOwnerOrAdmin=function(req, res, next) {
  function isUserShopOwner(){
    return (_.any(req.user.shops,function(s){return s.urlpath===req.params.shopname}));
  }
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if admin, we've done here
  if (req.user.isAdmin()) 
    return next();  

  //
  // ensure owner
	if(!isUserShopOwner()){ 
    return res.send(401, "Your are not the owner of this shop"); 
	}
	
  return next();

}
    
    


exports.create=function (req, res) {

  try{
    validate.shop(req.body);
  }catch(err){
    return res.send(400, err.message);
  }  

  db.model('Shops').create(req.body, req.user, function(err,shop){
    if(err){
      //TODO error
    	res.status(400);
      return res.json(err);
    }      
    res.json(shop);
  });
};

exports.remove=function (req, res) {

  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();    
  }catch(err){
    return res.send(400, err.message);
  }  

  //
  // check admin or owner
  // delegated 


  db.model('Shops').remove({urlpath:req.params.shopname},function(err){
    if (err){
    	res.status(400);
      return res.json(err);    
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
    return res.send(400, err.message);
  }
    
  Shops.findOneShop({urlpath:req.params.shopname},function (err,shop){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    
    if (!shop){
      res.status(400);
      return res.json("Cannot find the shop "+req.params.shopname);    
    }

    return res.json(shop);  
  });
};
exports.email=function(req,res){
  try{
    validate.check(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 34).isSlug();    
    if(req.user.email.status!==true)throw new Error("Vous devez avoir une adresse email valide");
    validate.check(req.body.content,"Le format de votre question n'est pas valide").len(3, 400).isText();
    if(!req.user)throw new Error("Vous devez avoir une session ouverte");
  }catch(err){
    return res.send(400, err.message);
  }  
  

  db.model('Shops').findOne({urlpath:req.params.shopname}).populate('owner').exec(function(err,shop){  
    if (err){
      return res.send(400,err);    
    }
    if(!shop){
      return res.send(400,"Cette boutique n'existe pas");    
    }

    //
    // 
    var content={};
    content.user=req.user;
    content.text=req.body.content;
    content.site=config.mail.site;
    //
    // send email
    bus.emit('sendmail',shop.owner.email.address, 
                 "Un utilisateur à une question pour votre boutique "+req.params.shopname, 
                 content, 
                 "shop-question", function(err, status){
      if(err){
        console.log(err,status)
        return res.send(400,err);
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
    return res.send(400, err.message);
  }  
  db.model('Shops').findOne({urlpath:req.params.shopname},function(err,shop){  
    if (err){
      return res.send(400,err);    
    }
    if(!shop){
      return res.send(400,"Cette boutique n'existe pas");    
    }
    if ((typeof shop.status)==='number'){
      // check the time elapsed from the last askStatus
      var oneday=1000*60*60*24;
      var elapsed=Math.round((Date.now()-shop.status)/oneday);
      // max 1 mail by month
      console.log(elapsed,Date.now(),shop.status, Date.now()-shop.status,oneday)
      if (elapsed<config.mail.ttl.long)
        return res.send(400,"Une demande d'activiation est déjà en cours");    
    }
    
    shop.status=Date.now();
    shop.save();
    
    var content=req.user;
    content.shop=shop;
    content.site=config.mail.site;
    console.log(config.mail.to)
    //
    // send email
    bus.emit('sendmail',config.mail.to, 
                 "Demande de publication du shop "+shop.name, 
                 content, 
                 "shop-status", function(err, status){
      if(err){
        console.log(err,status)
        return res.send(400,err);
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
    return res.send(400, err.message);
  }  
      
  
  db.model('Shops').findOne({urlpath:req.params.shopname},function(err,shop){  
    if (err){
      return res.send(400,err);    
    }
    if(!shop){
      return res.send(400,"Cannot find the shop");    
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
    return res.send(400, err.message);
  }  


  //
  // check for only admin updates
  if (!req.user.isAdmin()){
      req.body.status&&delete(req.body.status);
  }

  //
  // with angular in UI we got some issue with the _id value
  function normalizeRef(field){
    return req.body[field]=(req.body[field]&&req.body[field]._id)?req.body[field]._id:req.body[field];
  }  
  req.body.catalog=normalizeRef('catalog');
  
  
  Shops.update({urlpath:req.params.shopname},req.body,function(err,shop){
    if (err){
    	res.status(400);
      return res.send(err);    
    }
    return res.json(shop);  
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
    return res.send(400, err.message);
  }  

  function getShops(where){
    var query=Shops.find(where);


    if (req.query.sort){
      console.log("sort shop by creation date: ",req.query.sort);
      query=query.sort(req.query.sort);
    }
    
    // filter 
    if(req.query.status){
      query=query.where("status",true);
    }
    
    //
    //FILTER only visible shop are available: 
    //       if (req.user._id == shop.owner || shop.status==true)
    if(!req.user||!req.user.isAdmin()){
      var filter=[{'status':true}];
      if(req.user){
        filter.push({'owner':req.user._id});
      }    
      query=query.or(filter);
    }
    
    
    query.populate('catalog').exec(function (err,shops){
      if (err){
        return res.send(400,err);    
      }
      //
      // as we dont know how to group by with mongo
      if (req.query.group){
        grouped=_.groupBy(shops,function(shop){
          return shop.catalog&&shop.catalog.name;
        });
        return res.json(grouped);
      }
    
      return res.json(shops);  
    });
  }
  
  if (req.params.category){
    return db.model('Categories').findBySlug(req.params.category,function(e,c){
      if (e){
        return res.send(400,e);
      }
      if (!c){
        return res.send(400,"Il n'existe pas de catégorie "+req.params.category);
      }
      return getShops({catalog:c._id});
    });    
  }
  return getShops({});
  
};
