
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {
  dropdb:true,
  mail:{
    from:'james@karibou.evaletolab.ch',
    to:['delphine.cluzel@gmail.com','evaleto@gmail.com'],
    info:'info@karibou.ch',
    validate:{time:24,short:1},
    origin:'http://karibou.evaletolab.ch',
    default:'mandril',
    mandril:{
      host:'smtp.mandrillapp.com',
      port:587,
      user:'',
      code:''
    }
  },

  mailing:{
    '1223':{
      name:'Cologny',
      title:"[karibou-subscribe-cologny] : ",
      mailchimp:'0f92954013'
    },
    '1212':{
      name:'Grand lancy',
      title:"[karibou-subscribe-grand-lancy] : ",
      mailchimp:'0f92954013'
    },
    '1219':{
      name:'Aïre',
      title:"[karibou-subscribe-aire] : ",
      mailchimp:'0f92954013'
    },
    '1226':{
      name:'Thonex',
      title:"[karibou-subscribe-thoney] : ",
      mailchimp:'0f92954013'
    },

    'main':{
      title:"",
      mailchimp:'0f92954013'
    }
  },

  admin:{
    handle:'secret',
    emails:['evaleto@gmail.com'],
    secret: process.env.KARIBOO_SECRET || '1234',
    webhook: {release:process.env.KARIBOU_RELEASE||'devel',secret:'qawsedr'},
    padding:'0e0e0e0e'
  },

  logistic:{
    emails:['evaleto@gmail.com']
  },

  payment:{
    allowMaxAmount:40000,
    provider:'stripe',
    reserve:1.15,
    stripe:{
      key:"sk_test_MqnGMPYmsEMyR5vjPuCs5Nnq"
    },
    karibou:{
      apikey:"sk_test_t1im5hjyMbW6cNgyZpATg"
    },
    postfinance:{
      enabled:false,
      sandbox:true,
      debug:false,
      pspid:process.env.PSPID||'test',
      apiUser:process.env.PFUSER||'test',
      apiPassword:process.env.PFSECRET||'test',
      shaSecret:process.env.PFSHA||'1testpostfinance'
    }
  },

  cors:{
    allowedDomains:['http://lo.cal:3000'],
    credentials:true,
    age:3600
  },

  express: {
    port: process.env.PORT || 4000,
    views: '/views',
    'view engine': 'jade',
    mongoSession:false
  },

 /**
  * Time to validate an email 2 ms
  */
  validate:{
    email:0.002
  },


  // TODO load by env
  mongo:{
    name:'mongodb://localhost/karibou-test',
    ensureIndex:true
  },

	nodetime:{
	},

  disqus:{
    pub:'123',
    secret:'456'
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

  		secret:'cp3a2v0elt955h9uqhgmskplhg85ljjm',
      key: ['sid'],
      cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 60 // = 60 days (in miliseconds)
      }
    },

    csrf: {}
	}
};
