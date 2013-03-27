
module.exports = function(app, express) {
  var debug =  require('debug')('models');

	// Module dependencies
	var mongoose = require('mongoose');
	var	Schema = mongoose.Schema;
  var mongoStore = require('connect-mongodb');
  
	// dependencies for authentication
	var passport = require('passport')
		, LocalStrategy = require('passport-local').Strategy;
		
 	// fix the issue with auth by using passport,
	//  https://github.com/rockbot/CrowdNotes




  // autoload model
  files = require("fs").readdirSync( './models' );
  for(var i in files) {
    require('../models/'+files[i]);
  }

  var Users=mongoose.model('Users');
  
  // http://elegantcode.com/2012/05/15/taking-toddler-steps-with-node-js-passport/
	if(config.auth.twit){
		var TwitterStrategy = require('passport-twitter').Strategy;

		passport.use(new TwitterStrategy({
				consumerKey: config.auth.twit.consumerKey,
				consumerSecret: config.auth.twit.consumerSecret,
				callbackURL: config.auth.twit.cb
			},
			function(token, secret, profile, done) {				
        console.log("token",token);
        console.log("secret",secret);
        
    		Users.findOrCreate({ id: profile.id, provider:profile.provider, photo:profile.photos[0].value }, function (err, user) {
    		  user.token=token;
      		return done(err, user);
    		});
 			}
		));
		
		
	}

	
	// Define local strategy for Passport
	passport.use(new LocalStrategy({
		  usernameField: 'email'
		},
		function(email, password, done) {
		  if(isNaN(email)){
		  }
		  
		  Users.authenticate(email, password, function(err, user) {
		    //
		    // check the first admin
		    return done(err, user);
		  });
		}
	));
		    
	// serialize user on login
	passport.serializeUser(function(user, done) {
	  
		done(null, user._id);
	});

	// deserialize user on logout
	passport.deserializeUser(function(id, done) {
		Users.findById(id).populate('shops').exec(function (err, user) {
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
	    //console.log(id,config.admin.emails, user.email)

		  
		  done(err, user);
		});
	});
	
	function SSO(req, res, next){
	  next();
	}
	
	app.configure(function () {
	  app.use(express.session({secret:config.session.secret}));
/**		
    app.use(express.session({
        store: mongoStore(config.mongo)
      , secret: config.session.secret
      }, function() {
        app.use(app.router);
    }));
**/
		app.use(passport.initialize());
		app.use(passport.session());  
		app.use(SSO);
		app.use(app.router);
	});

	// connect to Mongo when the app initializes
	mongoose.connect(config.mongo);

  // Check connection to mongoDB
  mongoose.connection.on('open', function() {
    debug('We have connected to mongodb');
  });

	if(config.auth.twit){
    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' })
    );
/**
 This is usefull for debug twitter auth
    app.get('/auth/twitter/callback', function(req, res, next) {
      console.log("session",req.session)
      console.log("params",req.session['oauth:twitter'].oauth_token)
      var  token=req.session['oauth:twitter'].oauth_token;
      var  success='/';
      var  failure='/login';
      if (req.session.redirect && token){
        success=req.session.redirect+'/auth/twitter/'+token;
        failure=req.session.redirect+'/auth/twitter/fail';
      }
      passport.authenticate('twitter', { successRedirect: success, failureRedirect: failure })(req, res, next);    
	  });
**/
    
  }


};
