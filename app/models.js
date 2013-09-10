
module.exports = function(app, express) {
  var debug =  require('debug')('models');

	// Module dependencies
	var mongoose = require('mongoose');
	var	Schema = mongoose.Schema;

  
	// dependencies for authentication
	var passport = require('passport'),
		  LocalStrategy = require('passport-local').Strategy;
		
 	// fix the issue with auth by using passport,
	//  https://github.com/rockbot/CrowdNotes


  // manage date
  var moment= require('moment');


  // autoload model
  files = require("fs").readdirSync( './models' );
  for(var i in files) {
	  if(/\.js$/.test(files[i])) require('../models/'+files[i]);
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
		  if (user.hash) {
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
	    //console.log(id,config.admin.emails, user.email)

		  
		  done(err, user);
		});
	});
	
	function SSO(req, res, next){
	  next();
	}
	
	//
	// manaing session
	// http://stackoverflow.com/questions/8749907/what-is-a-good-session-store-for-a-single-host-node-js-production-app
	app.configure(function () {
	  
	  app.use(express.cookieSession({
      secret: config.middleware.session.secret,
      cookie: config.middleware.cookie
    }));
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
	  app.use(function(req,res,next){
      if( req.method.toLowerCase() !== "get" ) {
        return next();
      }
	    
	    //
	    // simple checker that should be replaced by an API-KEY
	    var d=moment().format('DDMMYYYYHH');
	    res.header('X-token', new Buffer(d+'kb').toString('base64'));
	    next();
	  })
		
		app.use(app.router);
		
	});

	// connect to Mongo when the app initializes
	mongoose.connect(config.mongo.name,function(e){  
	    //double check for database drop
	    console.log("db :",mongoose.connection.db.databaseName)
	    console.log("db name:",config.mongo.name)
	    console.log("db env:",process.env.NODE_ENV)
	    //config.shop.status={db:mongoose.connection.db.databaseName};
	    

    	if(config.dropdb && process.env.NODE_ENV==='test'){
    	  mongoose.connection.db.dropDatabase(function(err,done){
    	  });
    	}
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
