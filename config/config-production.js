
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {
  mail:{
    from:'james@karibou.io',
    to:['james@karibou.io'],
    ttl:{long:24,short:1},
    site:'http://karibou.io',
    default:'mandril',
    mandril:{    
      host:'smtp.mandrillapp.com',
      port:587,
      user:'evaleto@gmail.com',
      code:process.env.MANDRIL 
    }
  },

  admin:{
    emails:['evaleto@gmail.com', 'delphine.cluzel@gmail.com'],
    secret: process.env.KARIBOO_SECRET,
    padding:'0e0e0e0e'    
  },

  payment:{
    postfinance:{psid:process.env.PFID ,password:process.env.PFSECRET}
  },

  cors:{
    allowedDomains:[
        'http://karibou.evaletolab.ch',
        'http://kariboo.evaletolab.ch',
        'http://logistic.evaletolab.ch',
        'http://karibou.io',
        'http://karibou.ch'
    ],
    credentials:true,
    age:3600
  },
  
  express: {
    port: process.env.PORT || 3000,
    views: '/views',
    'view engine': 'jade',
    csrf:false,
    mongoSession:true,
    proxy:true
  },
  
  mongo:{
    name:process.env.MONGOLAB_URI,
    name_openshift:process.env.OPENSHIFT_MONGODB_DB_URL,
    ensureIndex:true
  },

 /**
  * Time to validate an email 2 days
  */
  validate:{
    email:60*60*24*2
  },
	
  disqus:{
    pub:process.env.DISQUS_PUBLIC,
    secret:process.env.DISQUS_SECRET
  },

	auth:{
    fb: {
        appId: '111565172259433'
      , appSecret: '85f7e0a0cc804886180b887c1f04a3c1'
    }
  , twit: {
        consumerKey: 'PzDBUUZoU5hVtigzAz73w'
      , consumerSecret: 'AvLzgxbZoJHMvV9RSCmvHGDL1ona0Zm9pOsw4FNGno'
		  , cb: "http://karibou-api.evaletolab.ch/auth/twitter/callback"
    }
  , github: {
        appId: '11932f2b6d05d2a5fa18'
      , appSecret: '2603d1bc663b74d6732500c1e9ad05b0f4013593'
    }
  , google: {
        clientId: '224794776836-cp3a2v0elt955h9uqhgmskplhg85ljjm.apps.googleusercontent.com'
      , clientSecret: 'rxGFo1mBG_H3DX2ifDFawiMZ'
      , cb: "http://karibou-api.evaletolab.ch/auth/google/callback"
    }	
  , persona:{
      audience:'http://kariboo.evaletolab.ch'
    }
	},
  

	// TODO auto load middleware?
  middleware: {
    showStackError: true,
    responseTime: true,

    favicon: PATH('static/favicon.ico'),

    logger: 'dev',

    bodyParser: {},

    methodOverride: '_method',

    cookieParser: process.env.COOKIE_PARSER||'ogXMXgRbnInguKYYx9Pm',

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

  		secret:process.env.SESSION_SECRET||'cp3a2v0elt955h9uqhgmskplhg85ljjm',
      key: 'sid',
      cookie: {
        path: '/',
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 10 // = 60 days (in miliseconds)
      }
    },

    csrf: {}
	}
};
