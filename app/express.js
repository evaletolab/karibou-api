/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose=require("mongoose")
  , MongoStore = require('connect-mongo')(express)
  , bus = require('../app/bus')
  , methodOverride = require('method-override')
  , helmet=require('helmet')

//  , flash = require('connect-flash')
//  , helpers = require('view-helpers')
  , pkg = require('../package.json')

//
// extend express state
// https://github.com/yahoo/express-state
if (config.express.state){
  var expstate = require('express-state')
  expstate.extend(app);
}  

  
module.exports = function (app, config, passport, sendmail) {

  //
  // CORS middleware
  // Allow cross-domain 
  var CORS = function(req, res, next) {
      res.header('Access-Control-Allow-Credentials', config.cors.credentials);
      if (config.cors.allowedDomains.indexOf(req.header('Origin')) !== -1) {
        res.header('Access-Control-Allow-Origin', req.header('Origin'));
      }

      res.header('Access-Control-Max-Age', config.cors.age);
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,X-Requested-With,ETag,Referer,Set-Cookie,X-Token');
      res.header('Access-Control-Expose-Headers','Content-Type,Accept,X-Requested-With,ETag, Set-Cookie, X-Token');
      if( req.method.toLowerCase() === "options" ) {
          res.writeHead(204);
          return res.end();        
      }
      next();
  }



// Use the authorization hook to attach the session to the socket
// handshake by reading the token and loading the session when a
// socket connects. Using the authorization hook means that we can
// deny access to socket connections that arrive without a session - i.e.
// where the user didn't load a site page through Express.js first.
//
// https://github.com/jaredhanson/passport-http-bearer
/*
var tokenSession=function (req, res, next) {
  if (!req.params.token){
    next();
  }
  if (!req.cookie){
  }

  var sessionId = someDecryptionFunction(data.query.token);
  sessionStore.get(sessionId, function (error, session) {
    // Add the sessionId. This will show up in
    // socket.handshake.sessionId.
    //
    // It's useful to set the ID and session separately because of
    // those fun times when you have an ID but no session - it makes
    // debugging that much easier.

}; */


  app.set('showStackError', true)


  if (config.express.proxy) {
    app.enable('trust proxy')
  };

  // set views path, template engine and default layout
  app.set('views', config.root+config.express.views)
  app.set('view engine', config.express['view engine'])

  // app.configure(function () {
    // expose package.json to views
    app.use(function (req, res, next) {
      res.locals.pkg = pkg
      next()
    })


    // should be placed before express.static 
    app.use(express.compress({
      filter: function (req, res) {
        return /json|text|javascript|css/.test(res.getHeader('Content-Type'))
      },
      level: 6
    }))

    //
    // use cors
    app.use(CORS);  


    app.use(express.favicon())
    app.use(express.static(config.root + '/public'))

    // don't use logger for test env
    if (process.env.NODE_ENV !== 'test') {
      // express.logger.token('msg', function(req, res){ 
      //   if(res.status>=400){
      //     console.log(res.text)
      //     return res.text
      //   }
      //   return '' 
      // })      
      
      app.use(express.logger(':remote-addr - :date - :method :url :status :msg - :referrer - :response-time ms'))
    }


    // cookieParser should be above session
    app.use(express.cookieParser())

    // bodyParser should be above methodOverride
    app.use(express.urlencoded())
    app.use(express.json())

    app.use(helmet());  

    app.use(methodOverride())

    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));  


    //
    // cookie session
    if (!config.express.mongoSession){
      app.use(express.cookieSession({
        secret: config.middleware.session.secret,
        cookie: config.middleware.session.cookie
      }));
    }


    // express/mongo session storage
    if (config.express.mongoSession){
      app.use(express.session({
        secret: config.middleware.session.secret,
        ttl:config.middleware.session.cookie.maxAge,
        cookie: config.middleware.session.cookie,
        store: new MongoStore({mongooseConnection : mongoose.connection})
      }))
    }


    // use passport session
    app.use(passport.initialize())
    app.use(passport.session())



    // connect flash for flash messages - should be declared after sessions
    // app.use(flash())

    // should be declared after session and flash
    //app.use(helpers(pkg.name))

    // adds CSRF support
    if (process.env.NODE_ENV !== 'test' && config.express.csrf) {
      app.use(express.csrf())
      //
      // http://stackoverflow.com/questions/19566949/csrf-protection-in-expressjs
      app.use(function(req, res, next){
        req.cookie('XSRF-TOKEN', req.csrfToken());
        return next()
      })
    }


    // routes should be at the last
    app.use(app.router)



    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function(err, req, res, next){

      //
      // no error
      if(!err){
        return next()
      }

      //send emails if you want
      if(process.env.NODE_ENV==='production'){
        var msg=JSON.stringify(
            {error:((err.stack)?err.stack:err),user:req.user, params:req.params},
            null,2
        );
        bus.emit("sendmail", "evaleto@gmail.com","[karibou] : "+err.toString(), 
            {content:msg}, "simple",function(err,status){
              console.log(err,status)
        });
      }


      if (typeof err==='string'){
        return res.send(400,err); 
      }


      // error page
      res.status(500).render('500', { error: err.stack })
      console.error(err.stack)
    })


    // assume 404 since no middleware responded
/*    
    app.use(function(req, res, next){
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not found'
      })
    })
*/
  // })

  // development env config
  if(app.get('env')=='development'){
    app.locals.pretty = true
  }
}
