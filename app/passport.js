var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
//  , GitHubStrategy = require('passport-github').Strategy
//  , FacebookStrategy = require('passport-facebook').Strategy
//  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
//  , LinkedinStrategy = require('passport-linkedin').Strategy
  , Users = mongoose.model('Users')


module.exports = function (app, config, passport) {
  // require('./initializer')

  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user._id)
  })


  // deserialize user on logout
  passport.deserializeUser(function(id, done) {
    Users.findById(id).populate('shops').populate('likes').exec(function (err, user) {
      if(!user){
        //session invalidate
        //https://github.com/jaredhanson/passport/issues/6
        return done(null,false);        
      }

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

  //  
  //
  // implement strategy


  // use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    function(email, password, done) {
      Users.authenticate(email, password, function(err, user) {
        if (err) { return done(err) }
        return done(null, user)
      })
    }
  ))

  if(config.auth.twit){
    // use twitter strategy
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


/***

  // use github strategy
  passport.use(new GitHubStrategy({
      clientID: config.github.clientID,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ 'github.id': profile.id }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.username,
            provider: 'github',
            github: profile._json
          })
          user.save(function (err) {
            if (err) console.log(err)
            return done(err, user)
          })
        } else {
          return done(err, user)
        }
      })
    }
  ))

  // use facebook strategy
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ 'facebook.id': profile.id }, function (err, user) {
        if (err) { return done(err) }
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.username,
            provider: 'facebook',
            facebook: profile._json
          })
          user.save(function (err) {
            if (err) console.log(err)
            return done(err, user)
          })
        }
        else {
          return done(err, user)
        }
      })
    }
  ))  

  // use google strategy
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ 'google.id': profile.id }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            username: profile.username,
            provider: 'google',
            google: profile._json
          })
          user.save(function (err) {
            if (err) console.log(err)
            return done(err, user)
          })
        } else {
          return done(err, user)
        }
      })
    }
  ));

  // use linkedin strategy
  passport.use(new LinkedinStrategy({
    consumerKey: config.linkedin.clientID,
    consumerSecret: config.linkedin.clientSecret,
    callbackURL: config.linkedin.callbackURL,
    profileFields: ['id', 'first-name', 'last-name', 'email-address']
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ 'linkedin.id': profile.id }, function (err, user) {
        if (!user) {
          user = new User({
            name: profile.displayName
          , email: profile.emails[0].value
          , username: profile.emails[0].value
          , provider: 'linkedin'
          })
          user.save(function (err) {
            if (err) console.log(err)
            return done(err, user)
          })
        } else {
          return done(err, user)
        }
      })
    }
    ));
**/
// end of passport
// 

}