
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {
  mail:{
    develMode:true,
    from:'james@karibou.ch',
    cc:['james@karibou.ch'],
    info:'info@karibou.ch',
    validate:{time:24,short:1},
    origin:'http://lo.cal:3000',
    default:'mandril',
    mandril:{
      host:'smtp.mandrillapp.com',
      port:587,
      user:'evaleto@gmail.com',
      code:process.env.MANDRIL ||'xnbFeUU_FJrqaF3U2n8uhg'
    }
  },
  mailing:{
    '1223':{
      name:'Cologny',
      title:"[karibou-subscribe-cologny] : ",
      mailchimp:'733ad74f31'
    },
    '1212':{
      name:'Grand lancy',
      title:"[karibou-subscribe-grand-lancy] : ",
      mailchimp:'733ad74f31'
    },
    '1219':{
      name:'Aïre',
      title:"[karibou-subscribe-aire] : ",
      mailchimp:'733ad74f31'
    },
    '1226':{
      name:'Thonex',
      title:"[karibou-subscribe-thoney] : ",
      mailchimp:'733ad74f31'
    },

    'apero':{
      name:'Apéro dégustation',
      title:'Apéro dégustation chez Mu-Food',
      mailchimp:'b3d63e7e47'
    },

    'cuisine':{
      name:'Atelier cuisine',
      title:'Atelier cuisine chez Mu-Food',
      mailchimp:'c95b350f6b'
    },

    'others':{
      name:'Others',
      title:"[karibou-subscribe-others] : ",
      mailchimp:'733ad74f31'
    },

    'main':{
      title:"",
      mailchimp:'50fe26a799'
    }
  },
  admin:{
    handle:'secret',
    emails:['evaleto@gmail.com'],
    secret: process.env.KARIBOO_SECRET ||'t1im5hjyMbW6juAb7W7o6QesrTUKVLe3E0jIlusvDeE=',
    webhook: {release:process.env.KARIBOU_RELEASE||'devel',secret:process.env.KARIBOU_GITHUB||'abc'},
    padding:'0e0e0e0e'
  },

  logistic:{
    emails:['evaleto@gmail.com','shopper1@karibou.ch']
  },

  payment:{
    allowMaxAmount:40000,
    reserve:1.15,
    provider:'stripe',
    stripe:{
      key:"sk_test_XtGOhmKlhARwWXHcNgyZpATg"
    },
    karibou:{
      offset:4,
      allowNegativeBalance:700,
      apikey:"sk_test_t1im5hjyMbW6cNgyZpATg"
    },
    postfinance:{
      enabled:true,
      sandbox:true,
      debug:true,
      tp:"http://localhost:4000/v1/psp/std",
      pspid:process.env.PSPID||'test',
      apiUser:process.env.PFUSER||'test',
      apiPassword:process.env.PFSECRET||'test',
      shaSecret:process.env.PFSHA||'test'
    }
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
    ensureIndex:true,
    multiple_:'mongodb://localhost/karibou-core'
  },

	nodetime:{
	  apikey:'f39e0560aedf625a03b0b06dbcb015907c1a3736'
	},

  /**
   * min (0-59), hour (0-23), day (1-31), month (1-12), weekday (0-6, 0 = Sunday)
   * example : 10 23 * * 0,3  =>  23:10 each Sunday,Wednesday
   *           59 * * * * => each 59 minutes 
   */
  cron:[
    {time:'10 23 * * 0,3',task:'order.mail.havest'},
    {time:'00 *  * * *',task:'order.mail.reminder'}
  ],

  timezone:"Europe/Zurich",


 /**
  * Time to validate an email 3 minutes
  */
  validate:{
    email:60*3
  },

  // disqus is not available for localhost
  disqus:{
    pub:'123',
    secret:'456'
  },

	auth:{
    mailchimp:{
        key:"a9ade807b26ef746022d094620244d9a-us9"
    },
    uploadcare:{
        pub:'b51a13e6bd44bf76e263',
        pk:'e1da8e0e16519c97364f'
    },
    fb: {
        appId: '178042049293834'
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
