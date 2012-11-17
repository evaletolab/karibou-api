
module.exports = function(app, express) {

	// Module dependencies
	var mongoose = require('mongoose');
	var	Schema = mongoose.Schema;
  var mongoStore = require('connect-mongodb');
  
	// dependencies for authentication
	var passport = require('passport')
		, LocalStrategy = require('passport-local').Strategy;
		
 	// fix the issue with auth by using passport,
	//  https://github.com/rockbot/CrowdNotes


	var Users=require('./users');
	var Products=require('./products');

  

	if(config.auth.twit){
		var TwitterStrategy = require('passport-twitter').Strategy;

		passport.use(new TwitterStrategy({
				consumerKey: config.auth.twit.consumerKey,
				consumerSecret: config.auth.twit.consumerSecret,
				callbackURL: config.auth.twit.cb
			},
			function(token, tokenSecret, profile, done) {
				console.log(token,tokenSecret,profile);
    		Users.findOrCreate({ twitterId: profile.id }, function (err, user) {
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
		  Users.authenticate(email, password, function(err, user) {
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
	
	
	app.configure(function () {
//	  app.use(express.session({ 
//	    secret:config.session.secret
//	  }));
//		app.use(app.router);
    app.use(express.session({
        store: mongoStore(config.mongo)
      , secret: config.session.secret
      }, function() {
        app.use(app.router);
    }));
		app.use(passport.initialize());
		app.use(passport.session());  
	});

	// connect to Mongo when the app initializes
	mongoose.connect(config.mongo);

  // Check connection to mongoDB
  mongoose.connection.on('open', function() {
    console.log('We have connected to mongodb');
  });

};
