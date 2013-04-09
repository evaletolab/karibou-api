
/*
 * Auth
 */

var app = require('../app/config');
var db  = require('mongoose');
var passport = require('passport');
var _ = require('underscore');

exports.ensureAuthenticated=function(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	//res.redirect('/login');
  res.statusCode = 401;
  res.send(401);	
}

exports.ensureAdmin=function(req, res, next) {
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if not admin, 
  if (!req.user.isAdmin()) { 
      return res.send(401);	
	}
	
  return next();
}


exports.logout = function (req, res) {
      req.logout();      
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
  
  redirect='/';
  if (req.param('redirect')){
    var redirect=req.param('redirect')
    var token_str=req.param('id')+new Date()
    var token=require('crypto').createHash('sha1').update(token_str).digest("hex");
  }
  //res.json({info:"hello"});
  passport.authenticate('local', function(err, user, info) {
     if (err) { return res.json(401,err); }
     if (!user) { return res.json(401,info?info:'Bad user credential'); }

      // CUSTOM USER CONTENT
		  //
		  // don't serialise the private hash, but confirm the password existance
		  if (user.hash) user.hash=true;
		  
	    //
	    // check the first admin
	    config.admin.emails.forEach(function(admin){
        if (user&&user.email.address === admin){
          user.roles.push('admin');
        }
	    });
     
     
     req.logIn(user, function(err) {
       if (err) { return res.json(403,err); }
       return res.json(req.user);
     });

   })(req, res, next);

};


exports.login= function(req, res) {
    //return res.json(req.user);
    //db.model('Users').findOne({ id: req.param('email').hash() }).populate('shops').exec(function(err,user){
    //  res.json([err,user]);
    //});
    res.render('login');
};


exports.register= function(req, res) {
    res.render('register');
};

  // app.post('/register'...)
exports.register_post= function(req, res) {

		db.model('Users')
		.register(req.param('email'),req.param('firstname'),req.param('lastname'),req.param('password'),req.param('confirm'),
		  function(err,user){
		    if (err){
        	res.status(401);
          return res.json(err);    
		    }

        if (!user){
          res.status(401);
          return res.json("Unknow error on registration");    
        }
        var redirect=req.param('redirect');
        if(redirect){
          return  res.redirect(redirect);
        }
        //else
        res.json(user)
		});
};

