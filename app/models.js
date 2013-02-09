
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
      		return done(err, user);
    		});
 			}
		));
		
		
	}

	
	// Define local strategy for Passport
	passport.use(new LocalStrategy({
		  usernameField: 'id'
		},
		function(id, password, done) {
		  Users.authenticate(id, password, function(err, user) {
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
		Users.findById(id, function (err, user) {
		  done(err, user);
		});
	});
	
	function SSO(req, res, next){
	  console.log(req.sessio)
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
		
	}


};
