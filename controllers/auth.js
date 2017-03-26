
/*
 * Auth
 */

var app = require('../app/config');
var db  = require('mongoose');
var bus =require('../app/bus');
var passport = require('passport');
var errorHelper = require('mongoose-error-helper').errorHelper;
var _ = require('underscore'),
    validate = require('./validate/validate')


var passport_Authenticate=function(req, res, next){
  return passport.authenticate('local', function(err, user, info) {

    if (err) { 
      return res.status(400).send(errorHelper(err)); 
    }
    if (!user) { 
      return res.status(400).send("L'utilisateur ou le mot de passe est incorrect"); 
    }
    
    //
    // populate roles for admin and shopper
    user.populateRoles()

    /* account is not valid */
    if (!user.isAdmin() && !user.status){
      console.log("ERROR","Votre compte est désactivé")    
      return res.status(401).send("Votre compte est désactivé");
    }

    
    // Manually establish the session...
    req.login(user,{}, function(err) {

      if (err) { 
        return res.status(403).send(err); 
      }
      return res.json(req.user);
    });

 })(req, res, next);
}

exports.ensureAuthenticated=function(req, res, next) {
	if (!req.isAuthenticated()) { 
      return res.status(401).send( "Vous devez ouvrir une session");	
	}
	
	//
	// admin user doenst depend on valid status
	if (!req.user.isAdmin()&&!req.user.status) { 
      return res.status(401).send( "Votre compte n'est pas actif");	
	}
	
  return next();
}

exports.ensureUserValid=function(req, res, next) {
	if (!req.isAuthenticated()) { 
      return res.status(401).send( "Vous devez ouvrir une session");	
	}
	
	//
	// admin user doenst depend on valid status
	if (!req.user.isAdmin()&&!req.user.status) { 
      return res.status(401).send( "Votre compte n'est pas actif");	
	}
  return next();
}

exports.ensureAdmin=function(req, res, next) {
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.sendStatus(401);	
	}

  // if not admin, 
  if (!req.user.isAdmin()) { 
      return res.status(401).send("Cette fonctionalité est réservée a un administrateur");	
	}
	
  return next();
}

exports.ensureLogisticOrAdmin=function(req,res,next){
  //
  // ensure auth
  if (!req.isAuthenticated()) { 
      return res.sendStatus(401); 
  }

  // if not admin, 
  if (!req.user.isAdmin()&&!req.user.hasRole('logistic')) { 
      return res.status(401).send("Cette fonctionalité est réservée à la logistique");  
  }
  
  return next();

}

exports.checkPassword=function(req, res, next) {
  try{
    var len=config.shared.system.password.len;
    validate.check(req.body.password,"Votre mot de passe doit contenir au moins "+len+" caractères").len(len, 64);
  }catch(err){  
    return res.status(400).send( err.message);
  }   

  // verify passwd
  req.user.verifyPassword(req.body.password, function(err, passwordCorrect) {
    if (err) { 
      res.status(400).send( err)
    }

    if (!passwordCorrect) { 
      return res.status(400).send( "Cette action est protégée. Le mot de passe est incorrect"); 
    }
    return next();
  });  
}


exports.logout = function (req, res) {
      req.logout();            
      res.json({status:'bye'});
};


exports.login_post=function(req, res, next) {
  //
  // manage the redirection when it's used as API
  //  md5=MD5(username+new Date())
  //  redirect=<URL>?access_token=md5
  //  session.access_token=md5

  try{
      if(req.user){
        return res.json(req.user)
      }
      validate.authenticate(req.body)
  }catch(err){  
    return res.status(400).send( err.message);
  }  
  
  //
  // setup a simple timer to prevent scripted multiple post 
  // FIXME TIMEOUT BLOCK THE SERVER !
  // setTimeout(function() {
  // }, config.shared.system.post.limitMS);
  passport_Authenticate(req, res, next)

};


exports.login= function(req, res) {
    res.render('login');
};


exports.register= function(req, res) {
    res.render('register');
};


//
// register has extended attributes 
// to register a complete profile
exports.register_post= function(req, res,next) {

    try{

      if(req.user){
        throw new Error("Une session est déjà ouverte")
      }

      validate.register(req.body)
      //
      // validate addresses (with force)
      for( var i in req.body.addresses){
        validate.address(req.body.addresses[i])
      }


    }catch(err){
       return res.status(400).send( err.message);
    }  
    var reg={}
    if(req.body.addresses&&req.body.addresses.length)reg.addresses=req.body.addresses;
    if(req.body.phoneNumbers&&req.body.phoneNumbers.length)reg.phoneNumbers=req.body.phoneNumbers
    
    //
    // setup a simple timer to prevent scripted multiple post 
    // setTimeout(function() {
      db.model('Users')
      .register(req.body.email,
                req.body.firstname,
                req.body.lastname,
                req.body.password,
                req.body.confirm,
                reg,
        function(err,user){
          if(err&&err.code==11000){
            return res.status(400).send("Cet utilisateur existe déjà");    
          }else
          if (err){
            return res.status(400).send(errorHelper(err));    
          }

          if (!user){
            return res.status(400).send("Erreur inconnue lors de la création du compte");    
          }

          user.createWallet(function (err) {
            if(err){
              bus.emit('system.message',"[karibou-wallet] karibou error: ",
                {message:err.message,stack:err.stack});
            }
            //
            // send mail validation after user creation
            var origin=req.header('Origin')||config.mail.origin;
            db.model('Emails').createAndSendMail(user.toObject(),origin,function(err,validate){
              if(err){
                bus.emit('system.message',"[karibou-register.mail] karibou error: ",
                  {message:err.message,stack:err.stack});
                return res.status(400).send(err)
              }

              //
              // subscribe to mailchimp this new account
              if(!user.mailchimp && user.name.familyName && user.name.givenName){
                bus.emit('mailchimp.subscribe',{
                    id:config.mailing.main.mailchimp,
                    fname:user.name.givenName,
                    lname:user.name.familyName,
                    email:user.email.address
                },function (err,data) {
                  console.log('DEBUG------- subscribe main list',err,data)
                });

              }

              //
              // authenticate user
              passport_Authenticate(req, res, next)
            });
          })
      });

    // }, config.shared.system.post.limitMS);
};

