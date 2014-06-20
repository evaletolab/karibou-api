
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {
  mail:{
    from:'james@karibou.evaletolab.ch',
    to:['delphine.cluzel@gmail.com','evaleto@gmail.com'],
    ttl:{long:24,short:1},
    site:'http://lo.cal:3000',
    default:'mandril',
    mandril:{    
      host:'smtp.mandrillapp.com',
      port:587,
      user:'evaleto@gmail.com',
      code:process.env.MANDRIL ||'Y6UqPC6BpB9YZFX-Wv2yyw'
    }
  },
  admin:{
    emails:['evaleto@gmail.com']
  },
  
  cors:{
    allowedDomains:['http://lo.cal:3000','http://192.168.1.39:3000'],
    credentials:true,
    age:3600
  },

  express: {
    port: process.env.PORT || 4000,
    views: '/views',
    'view engine': 'jade',
    csrf:false,
    mongoSession:true    
  },
  
  
  
  // TODO load by env  
  mongo:{
    name:'mongodb://localhost/karibou-devel',
    ensureIndex:true
  },

	nodetime:{
	  apikey:'f39e0560aedf625a03b0b06dbcb015907c1a3736'
	},
	
	auth:{
    fb: {
        appId: '111565172259433'
      , appSecret: '85f7e0a0cc804886180b887c1f04a3c1'
    }
  , twit: {
        consumerKey: 'PzDBUUZoU5hVtigzAz73w'
      , consumerSecret: 'AvLzgxbZoJHMvV9RSCmvHGDL1ona0Zm9pOsw4FNGno'
		  , cb: "http://localhost:4000/auth/twitter/callback"
    }
  , github: {
        appId: '11932f2b6d05d2a5fa18'
      , appSecret: '2603d1bc663b74d6732500c1e9ad05b0f4013593'
    }
  , google: {
        clientId: '224794776836-cp3a2v0elt955h9uqhgmskplhg85ljjm.apps.googleusercontent.com'
      , clientSecret: 'rxGFo1mBG_H3DX2ifDFawiMZ'
      , cb: 'http://localhost:4000/auth/google/callback'
    }	
  , persona:{
      audience:'http://lo.cal:3000'
    }
	},
  

	// TODO auto load middleware?
  middleware: {
    responseTime: true,

    favicon: PATH('static/favicon.ico'),

    logger: 'dev',

    bodyParser: {},

    methodOverride: '_method',

    cookieParser: 'ogXMXgRbnInguKYYx9Pm',


    session: {
      /*
       *  key         cookie name defaulting to connect.sid
       *  secret      session cookie is signed with this secret
       *              to prevent tampering
       *  cookie      session cookie settings, defaulting to
       *              { path: '/', httpOnly: true, maxAge: null }
       *  proxy       trust the reverse proxy when setting secure cookies
       *              (via "x-forwarded-proto")
      */

  		secret:'cp3a2v0elt955h8uqhgmskplhg85ljjm',
      key: 'sid',
      cookie: {
        path: '/',
        httpOnly: false,
        maxAge: 1000 * 60 * 30 * 24 * 60 // = 60 days (in miliseconds)
      }
    },

    csrf: {}
	}
};
