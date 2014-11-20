
/*
 * Auth
 */

var app = require('../app/config');
var db  = require('mongoose');
var passport = require('passport');
var errorHelper = require('mongoose-error-helper').errorHelper;
var _ = require('underscore'),
    validate = require('./validate/validate')


var passport_Authenticate=function(req, res, next){
  return passport.authenticate('local', function(err, user, info) {

    if (err) { 
      return res.send(400,errorHelper(err)); 
    }
    if (!user) { 
      return res.send(400,"L'utilisateur ou le mot de passe est incorrect"); 
    }
    // CUSTOM USER CONTENT
    //
    // don't serialise the private hash/salt, but confirm the password existance
    if (user.hash){ 
      user.hash=true;
      user.salt=true;
    }
    
    //
    // check the first admin
    config.admin.emails.forEach(function(admin){
      if (user&&user.email.address === admin){
        user.roles.push('admin');
      }
    });
    
    /* account is not valid */
    if (!user.isAdmin() && !user.status){
      console.log("ERROR","Votre compte est désactivé")    
      return res.send(401,"Votre compte est désactivé");
    }
    
    req.logIn(user, function(err) {

      if (err) { return res.send(403,err); }
      return res.json(req.user);
    });

 })(req, res, next);
}

exports.ensureAuthenticated=function(req, res, next) {
	if (!req.isAuthenticated()) { 
      return res.send(401, "Vous devez ouvrir une session");	
	}
	
	//
	// admin user doenst depend on valid status
	if (!req.user.isAdmin()&&!req.user.status) { 
      return res.send(401, "Votre compte n'est pas actif");	
	}
	
  return next();
}

exports.ensureUserValid=function(req, res, next) {
	if (!req.isAuthenticated()) { 
      return res.send(401, "Vous devez ouvrir une session");	
	}
	
	//
	// admin user doenst depend on valid status
	if (!req.user.isAdmin()&&!req.user.status) { 
      return res.send(401, "Votre compte n'est pas actif");	
	}
  return next();
}

exports.ensureAdmin=function(req, res, next) {
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if not admin, 
  if (!req.user.isAdmin()) { 
      return res.send(401,"Cette fonctionalité est réservée a un administrateur");	
	}
	
  return next();
}

exports.checkPassword=function(req, res, next) {
  try{
    var len=config.shop.system.password.len;
    validate.check(req.body.password,"Votre mot de passe doit contenir au moins "+len+" caractères").len(len, 64);
  }catch(err){  
    return res.send(400, err.message);
  }   

  // verify passwd
  req.user.verifyPassword(req.body.password, function(err, passwordCorrect) {
    if (err) { 
      res.send(400, err)
    }

    if (!passwordCorrect) { 
      return res.send(400, "Cette action est protégée. Le mot de passe est incorrect"); 
    }
    return next();
  });  
}


exports.logout = function (req, res) {
      req.logout();      
      //res.clearCookie('connect.sid', { path: '/' });
      if (req.param('redirect')){
        var redirect=req.param('redirect')
        return res.redirect('/');
      }
      
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
        throw new Error("Une session est déjà ouverte")
      }

      validate.authenticate(req.body)
  }catch(err){  
    console.log("ERROR",err.message)    
    return res.send(400, err.message);
  }  
  
  //
  // setup a simple timer to prevent scripted multiple post 
  setTimeout(function() {
    passport_Authenticate(req, res, next)
  }, config.shop.system.post.limitMS);

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
      validate.user(req.body, true)

    }catch(err){
      console.log("ERROR [register] ", err.message)
      return res.send(400, err.message);
    }  
    var reg={}
    if(req.body.addresses&&req.body.addresses.length)reg.addresses=req.body.addresses;
    if(req.body.phoneNumbers&&req.body.phoneNumbers.length)reg.phoneNumbers=req.body.phoneNumbers
    
    //
    // setup a simple timer to prevent scripted multiple post 
    // setTimeout(function() {
      db.model('Users')
      .register(req.param('email'),
                req.param('firstname'),
                req.param('lastname'),
                req.param('password'),
                req.param('confirm'),
                reg,
        function(err,user){
          if(err&&err.code==11000){
            console.log("ERROR [register] ", "Cet adresse email est déjà utilisée")
            return res.send(400,"Cet adresse email est déjà utilisée");    
          }else
          if (err){
            console.log("ERROR",errorHelper(err))    
            return res.send(400,errorHelper(err));    
          }

          if (!user){
            console.log("ERROR","[register] Ooooppss!!")
            return res.send(400,"Erreur inconnue lors de la création du compte");    
          }
          //
          // redirect for non ajax register
          var redirect=req.param('redirect');
          if(redirect){
            return  res.redirect(redirect);
          }

          //
          // send mail validation after user creation
          var origin=req.header('Origin')||config.mail.origin;
          db.model('Emails').createAndSendMail(user,origin,function(err,validate){
            if(err){
              console.log("ERROR",err)
              return res.send(400,err)
            }
            //
            // authenticate user
            passport_Authenticate(req, res, next)
          })
      });

    // }, config.shop.system.post.limitMS);
};

