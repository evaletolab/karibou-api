
/*
 * Users API
 */
var db = require('mongoose'),
    bus=require('../app/bus')
    Users= db.model('Users'),
    password = require('password-generator'),
    validate = require('./validate/validate'),
    errorHelper = require('mongoose-error-helper').errorHelper;




exports.ensureMe=function(req, res, next) {

  //
  // ensure auth
	if (!req.isAuthenticated()) {
      return res.send(401);
	}

  // if not me,
  var me=parseInt(req.params.id)||req.body.id;
  if (req.user.id!==me) {
      return res.send(401, "Vous n'êtes pas le propriétaire de ce compte");
	}

  return next();
}

exports.ensureMeOrAdmin=function(req, res, next) {

  //
  // ensure auth
  if (!req.isAuthenticated()) {
      return res.send(401);
  }

  // ok if admin
  if (req.user.isAdmin()){
    return next()
  }

  // if not me,
  var me=parseInt(req.params.id)||req.body.id;
  if (req.user.id!==me) {
      return res.send(401, "Vous n'êtes pas le propriétaire de ce compte");
  }

  return next();
}




exports.me = function (req, res, next)  {
  //
  // res.json(req.user);
  Users.findOne({_id:req.user._id}).
      populate('shops').exec(function(err,user){
      user.populateRoles()
      user.context={};
      if(config.disqus){
        user.context.disqus=user.getDisquSSO();
      }
      res.json(user);
  });
};


exports.list = function (req, res, next)  {
  //
  // TODO add criteria
  Users.find({}).populate('shops').exec(function(err,users){
      if (err){
        return res.send(400,errorHelper(err.message||err));
      }
      users.forEach(function(user){
        user.populateRoles()
      })
      return res.json(200,users);
  });
}

exports.recover=function(req,res){
  try{
    //check(req.params.token,"token inconnu").isEmail();
    validate.check(req.params.email,"Entrez une adresse mail valide").isEmail();
  }catch(err){
    return res.send(400, err.message);
  }


  Users.findOne({'email.address': req.params.email},
    function(err,user){

      if (err){
        return res.send(400,err);
      }
      if(!user){
        return res.send(400,"Utilisateur inconnu");
      }

      //
      // change the password
      var content=user;
      content.password=user.password=password();
      content.origin=req.header('Origin')||config.mail.origin;
      user.save(function(err){
        if(err)return res.send(400,err);

        bus.emit('user.send.password',user,res)

        //
        // send email
        bus.emit('sendmail',user.email.address,
                     "Vous avez un nouveau mot de passe",
                     content,
                     "password", function(err, status){
          if(err){
            return res.send(400,err);
          }

          return res.json("Un nouveau mot de passe à été envoyé à votre adresse mail.");
        });


      });

  });
};

exports.password=function(req,res){

  try{
      validate.check(req.params.id,"Invalid uid request").isInt();
      validate.password(req.body)
      if(!req.body.current && req.user.hash) throw new Error("Il manque votre mot de passe");
  }catch(err){
    return res.send(400, err.message);
  }


  var stderr="L' utilisateur "+req.body.email+":"+req.params.id+" n'existe pas ou son mot de passe est incorrect";

  Users.findOne({'email.address': req.body.email, id:req.params.id}).select('+hash +salt')
    .exec(function(err,user){
      if (err){
        return res.send(400,err);
      }
      //
      // check user
      if(!user){
        return res.send(400,stderr);
      }

      //
      // check password
      user.verifyPassword(req.body.current, function(err, passwordCorrect) {
        if (err) {
          return res.send(400,err);
        }
        if (!passwordCorrect) {
          return res.send(400,stderr+" (2)");
        }

        //
        // change the password
        user.password=req.body.new;
        user.save(function(err){
          if(err)return res.send(400,err);
          return res.json({});
        });
      });

  });

};

exports.update=function(req,res){
  try{
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.user(req.body,req.user.isAdmin());
  }catch(err){
    return res.send(400, err.message);
  }

  //
  // silently remove some fields
  if(req.body.password){delete(req.body.password);}
  if(req.body.hash){delete(req.body.hash);}
  if(req.body.salt){delete(req.body.salt);}

  //
  // normalize ref _id
  for (var i = req.body.shops.length - 1; i >= 0; i--) {
    req.body.shops[i]=(req.body.shops[i]._id)?req.body.shops[i]._id:req.body.shops[i];
  };

  Users.findOne({id:req.params.id}).exec(function(err,user){

    //
    // protect shop edition
    req.body.shops=user.shops;


    //
    // if not admin silently fix   
    if(!req.user.isAdmin()){
      req.body.id=user.id;
      req.body.status=user.status;
      req.body.roles=user.roles;
      req.invoice=user.invoice;
      req.merchant=user.merchant;
      req.gateway_id=user.gateway_id;
      req.rank=user.rank;
    }

    if(req.body.email.address===user.email.address){
      delete (req.body.email);
    }
    //
    // TODO rewrite safe! do the update 
    _.extend(user,req.body);

    user.save(function (err,user) {
      if (err){
        if(err.code==11001){
          return res.send(400,"Cette adresse email est déjà utilisée");
        }
        return res.send(400,errorHelper(err.message||err));
      }
      return res.json(user);
    })
  });

};

exports.addPayment=function(req,res){

  try{
    var alias="fake alias to avoid error";
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.payment(req.body, alias);
  }catch(err){
    return res.send(400, err.message);
  }


  Users.addPayment(req.params.id,req.body,function(err,user){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json(user);
  });
};

exports.deletePayment=function(req,res){
  try{
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.check(req.params.alias,  "Ce mode de paiement est inconnu").isText().len(6, 256)
  }catch(err){
    return res.send(400, err.message);
  }

  Users.deletePayment(req.params.id,req.params.alias,function(err){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json({});
  });
};

exports.checkPaymentMethod=function (req,res) {
  try{
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.check(req.params.alias,  "Ce mode de paiement est inconnu").isText().len(6, 256)
    req.body.alias&&req.body.alias.forEach(function (alias) {
      validate.check(alias,  "Ce mode de paiement est inconnu").isText().len(6, 256)
    })
  }catch(err){
    return res.send(400, err.message);
  }
  var alias=[req.params.alias]
  if(req.body.alias && Array.isArray(req.body.alias)){
    req.body.alias.forEach(function (a) {
      alias.push(a)
    })
  }
  Users.checkPaymentMethod(req.params.id,alias,function(err,result){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json(result);
  });
}

exports.updatePayment=function(req,res){
  try{
    var alias=(req.params.alias)?req.params.alias:req.body.alias
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.payment(req.body,alias);
  }catch(err){
    return res.send(400, err.message);
  }

  Users.updatePayment(req.params.id,req.params.alias, req.body,function(err,payment){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json(payment);
  });
};


exports.unlike=function(req,res){

  try{
    validate.check(req.params.id,"Invalid uid request").isInt();
    validate.check(req.params.sku, "Invalid pid request").isInt();
  }catch(err){
    return res.send(400, err.message);
  }

  Users.unlike(req.params.id,params.sku,function(err,user){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json(user);
  });

};

exports.like=function(req,res){

  try{
    validate.check(req.params.sku,'Invalid SKU').isInt();
  }catch(err){
    return res.send(400, err.message);
  }

  Users.like(req.user.id, req.params.sku,function(err,user){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    // req.user.likes=user.likes;
    return res.json(user);
  });

};


exports.status=function(req,res){

  try{
    validate.check(req.params.id).isInt();
    if(req.body.status===undefined)throw new Error("Invalid uid request");;
  }catch(err){
    return res.send(400, err.message);
  }

  Users.updateStatus({id:req.params.id},req.body.status,function(err,user){
    if (err){
      return res.send(400,errorHelper(err.message||err));
    }
    return res.json(user);
  });

};


exports.remove= function(req, res) {
  try{
    validate.check(req.params.id, "Invalid uid request").isInt();
  }catch(err){
    return res.send(400, err.message);
  }
  Users.findOne({id:req.params.id},function(err,user){
    if (err){return res.send(400,errorHelper(err.message||err))}

    if(!user){return res.send(400,"L'utilisateur n'existe pas")}

    //user has shop ?
    if(user.shops&&user.shops.length){
      return res.send(400,"Impossible de supprimer un utilisateur qui possède une boutique.")
    }

    user.remove(function(err){
      if (err){return res.send(400,errorHelper(err.message||err))}
      return res.send(200);
    });

  })

};
