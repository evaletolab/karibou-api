/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose=require("mongoose")
  , bus = require('../app/bus')
  , methodOverride = require('method-override')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , compress = require('compression')
  , cookieParser = require('cookie-parser')
  , session = require('express-session')
  , MongoStore = require('connect-mongo')(session)
  , bodyParser = require('body-parser')
  , errorHandler = require('errorhandler')
  , helmet=require('helmet')
//  , flash = require('connect-flash')
//  , helpers = require('view-helpers')
  , i18n = require("i18n-2")
  , pkg = require('../package.json');

//
// extend express state
// https://github.com/yahoo/express-state
if (config.express.state){
  var expstate = require('express-state')
  expstate.extend(app);
}  

//
// get port configuration
var port = (process.env.C9_PORT || process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || config.express.port);

  
module.exports = function (app, config, passport) {

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
  app.set('port', port);

  app.use(function (req, res, next) {
    res.locals.pkg = pkg
    next()
  })


  // should be placed before express.static 
  app.use(compress({
    filter: function (req, res) {
      return /json|text/.test(res.getHeader('Content-Type'))
    },
    level: 6
  }))

  //
  // use cors
  app.use(CORS);  


  //app.use(favicon())
  app.use(express.static(config.root + '/public'))

  // don't use logger for test env
  if (process.env.NODE_ENV !== 'test') {
    logger.token('uid', function(req, res){ return req.user&&req.user.id||'anonymous'; })    
    app.use(logger(':remote-addr - :uid - :date[iso] - :status - :method :url - :response-time ms'))
  }


  // cookieParser should be above session
  app.use(cookieParser())

  app.use(helmet());  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride())

  app.use(errorHandler({ dumpExceptions: true, showStack: true }));  


  //
  // cookie session
  if (!config.express.mongoSession){
    app.use(session({
      secret: config.middleware.session.secret,
      ttl:config.middleware.session.cookie.maxAge,
      cookie: config.middleware.session.cookie,
      proxy: config.express.proxy,
      resave: false,
      saveUninitialized: false      
    }));
  }


  // express/mongo session storage
  if (config.express.mongoSession){
    app.use(session({
      secret: config.middleware.session.secret,
      ttl:config.middleware.session.cookie.maxAge,
      cookie: config.middleware.session.cookie,
      store: new MongoStore({mongooseConnection : mongoose.connection}),
      proxy: config.express.proxy,
      resave: false,
      saveUninitialized: false      
    }));
  }


  // use passport session
  app.use(passport.initialize())
  app.use(passport.session())



  // adds CSRF support
  if (process.env.NODE_ENV !== 'test' && config.express.csrf) {
    console.log('----------- CSRF SHOULD BE CONFIGURED');
    process.exit(1);

    app.use(express.csrf())

    //
    // http://stackoverflow.com/questions/19566949/csrf-protection-in-expressjs
    app.use(function(req, res, next){
      req.cookie('XSRF-TOKEN', req.csrfToken());
      return next()
    })
  }

  //
  // i18n middleware
  if (config.shared.i18n){
    i18n.expressBind(app, {
        locales:config.shared.i18n.locales,
        defaultLocale: config.shared.i18n.defaultLocale,
        directory: __dirname + '/locales'
    });  


    // This is how you'd set a locale from req.cookies.
    // Don't forget to set the cookie either on the client or in your Express app.
    app.use(function(req, res, next) {

        //
        // update locale in session
        if(req.query.lang && config.shared.i18n && config.shared.i18n.locales.indexOf(req.query.lang)!==-1){
          req.session.lang=req.query.lang;
        }
       
        if(req.session.lang){
          req.i18n.setLocale(req.session.lang);
        }
        next();
    });
  }


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
      var email=req.user?req.user.email:'Anonymous';
      var msg=JSON.stringify(
          {error:((err.stack)?err.stack:err),user:email, url:req.originalUrl, params:req.params,body:req.body},
          null,2
      );
      bus.emit("sendmail", "evaleto@gmail.com","[karibou] : "+err.toString(), 
          {content:msg}, "simple",function(err,status){
            console.log(err,status)
      });
    }


    if (typeof err==='string'){
      return res.status(400).send(err); 
    }


    // error page
    res.status(500).render('500', { error: err.stack })
    console.error(err.stack)
  })



  // development env config
  if(app.get('env')=='development'){
    app.locals.pretty = true
  }
}
