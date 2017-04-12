var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  // , PersonaStrategy = require('passport-persona').Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , bank = require("karibou-wallet")()
//  , GitHubStrategy = require('passport-github').Strategy
//  , FacebookStrategy = require('passport-facebook').Strategy
//  , LinkedinStrategy = require('passport-linkedin').Strategy
  , Users = mongoose.model('Users')


module.exports = function (app, config, passport) {





  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user._id)
  })


  // deserialize user on logout
  passport.deserializeUser(function(id, done) {
    Users.findById(id).populate('shops').exec(function (err, user) {
      if(!user){
        //session invalidate
        //https://github.com/jaredhanson/passport/issues/6
        return done(null,false);        
      }

      user.context={};

      //
      // don't serialise the private hash, but confirm the password existance
      // if (user.hash) {
      //   user.hash=true;
      //   user.salt=true;
      // }
      
      if(config.disqus){
        user.context.disqus=user.getDisquSSO();
      }

      //
      // populate default roles
      user.populateRoles();

      // generate user BVR
      // user=user.toObject();
      user.bvr=bank.mod10gen(user.id+'0');

      //console.log(id,config.admin.emails, user.email)
      // var u= user.toObject()
      // console.log(u)
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
          Users.findOrCreate({ id: profile.id, provider:profile.provider }, function (err, user) {
              user.token=token;
              return done(err, user);
          });
      }
    ));

    // define route
    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', { successRedirect: '/welcome', failureRedirect: '/login' })
    );

  }

  if(config.auth.google){
    // use google strategy
    passport.use(new GoogleStrategy({
        clientID: config.auth.google.clientId,
        clientSecret: config.auth.google.clientSecret,
        callbackURL: config.auth.google.cb
      },
      function(accessToken, refreshToken, profile, done) {
        var u={id: profile.id, provider:'google' }
        if(profile.emails[0].value)u['email.address']=profile.emails[0].value
        Users.findOrCreate(u, function (err, user) {
            user.token=token;
            return done(err, user);
        });
      }
    ));

    // define route
    app.get('/auth/google', passport.authenticate('google'));
    app.get('/auth/google/callback', 
      passport.authenticate('google', { successRedirect: '/welcome', failureRedirect: '/login' })
    );

  }

  if(config.auth.facebook){

    /**
     * Sign in with Facebook.
     */
     /**
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
      passReqToCallback: true
    }, function(req, accessToken, refreshToken, profile, done) {
      if (req.user) {
        User.findOne({ facebook: profile.id }, function(err, existingUser) {
          if (existingUser) {
            req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
            done(err);
          } else {
            User.findById(req.user.id, function(err, user) {
              user.facebook = profile.id;
              user.tokens.push({ kind: 'facebook', accessToken: accessToken });
              user.profile.name = user.profile.name || profile.displayName;
              user.profile.gender = user.profile.gender || profile._json.gender;
              user.profile.picture = user.profile.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
              user.save(function(err) {
                req.flash('info', { msg: 'Facebook account has been linked.' });
                done(err, user);
              });
            });
          }
        });
      } else {
        User.findOne({ facebook: profile.id }, function(err, existingUser) {
          if (existingUser) {
            return done(null, existingUser);
          }
          User.findOne({ email: profile._json.email }, function(err, existingEmailUser) {
            if (existingEmailUser) {
              req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
              done(err);
            } else {
              var user = new User();
              user.email = profile._json.email;
              user.facebook = profile.id;
              user.tokens.push({ kind: 'facebook', accessToken: accessToken });
              user.profile.name = profile.displayName;
              user.profile.gender = profile._json.gender;
              user.profile.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
              user.profile.location = (profile._json.location) ? profile._json.location.name : '';
              user.save(function(err) {
                done(err, user);
              });
            }
          });
        });
      }
    }));    
    */
  } 

  // if(config.auth.persona){
  //   // use google strategy
  //   passport.use(new PersonaStrategy({
  //       audience: config.auth.persona.audience
  //     },
  //     function(email, done) {
  //       Users.findOrCreate({provider:'persona', "email.address": email }, function (err, user) {
  //         return done(err, user);
  //       });
  //     }
  //   ));    

  //   // define route
  //   app.post('/auth/browserid', 
  //     passport.authenticate('persona', { failureRedirect:'/login' }),
  //     function(req,res){
  //       return res.json(req.user)
  //     }
  //   );

  // }
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