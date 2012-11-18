
/*
 * Auth
 */

require('../app/config');
var db = require('mongoose');
var passport = require('passport');

exports.ensureAuthenticated=function(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

exports.logout = function (req, res) {
      req.logout();
      res.redirect('/');
};


exports.login_post=passport.authenticate('local',{
      successRedirect: '/',
      failureRedirect: '/login'
});  

exports.login= function(req, res) {
    res.render('login');
};


exports.register= function(req, res) {
    res.render('register');
};

  // app.post('/register'...)
exports.register_post= function(req, res) {
		db.model('Users').register(req.param('email'),req.param('password'),req.param('confirm'),function(err,user){
      res.redirect('/');
		});
};

