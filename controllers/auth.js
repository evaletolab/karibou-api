
/*
 * Auth
 */

var app = require('../app/config');
var db  = require('mongoose');
var passport = require('passport');
var errorHelper = require('mongoose-error-helper').errorHelper;
var _ = require('underscore'),
    validator = require('../app/validator'),
    check = validator.check,
    sanitize = validator.sanitize;


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
    check(req.body.password,"Cette action est protégée par votre mot de passe").len(4, 64);
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
    check(req.body.email,"Le format de l'email est invalide").isEmail();
    check(req.body.provider).len(3, 64);
    check(req.body.password).len(4, 64);
  }catch(err){  
    // console.log(err.stack)    
    return res.send(400, err.message);
  }  
  
  //res.json({info:"hello"});
  passport.authenticate('local', function(err, user, info) {

      if (err) { 
        return res.send(400,err); 
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
	      return res.send(401,"Votre compte est désactivé");
	    }
      
      req.logIn(user, function(err) {
        if (err) { return res.send(403,err); }
        return res.json(req.user);
      });

   })(req, res, next);

};


exports.login= function(req, res) {
    res.render('login');
};


exports.register= function(req, res) {
    res.render('register');
};

  // app.post('/register'...)
exports.register_post= function(req, res) {

    try{
      check(req.body.email,"Le format de l'email est invalide").isEmail();
      check(req.body.firstname,"Le format du nom est invalide").len(3, 64);
      check(req.body.lastname,"Le format de prénom est invalide").len(3, 64);
      check(req.body.password,"Le passowrd est invalide").len(3, 64);
    }catch(err){
      return res.send(400, err.message);
    }  
  
		db.model('Users')
		.register(req.param('email'),req.param('firstname'),req.param('lastname'),req.param('password'),req.param('confirm'),
		  function(err,user){
		    if (err){
          return res.send(400,errorHelper(err));    
		    }

        if (!user){
          return res.send(400,"Unknow error on registration");    
        }
        //
        // redirect for non ajax register
        var redirect=req.param('redirect');
        if(redirect){
          return  res.redirect(redirect);
        }
        //else
        res.json(user)
		});
};

