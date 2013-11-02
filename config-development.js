
var path = require('path');
var PATH = function(p) {
  return path.resolve(__dirname, p);
};

module.exports = {
  shop:{
    category:{
      types:['Category', 'Catalog']
    },
    marketplace:{
      list:["Eaux-vives", "Carouge", "Plain-palais"],
      default:"Eaux-vives"
    },
    user:{
      location:{
        list:["Genève-Ville", "Carouge"]
      }
    },
    location:{
      list:["Aire-la-Ville","Anières","Avully","Avusy","Bardonnex","Bellevue",
            "Bernex","Carouge","Cartigny","Céligny","Chancy","Chêne-Bougeries",
            "Chêne-Bourg","Choulex","Collex-Bossy","Collonge-Bellerive",
            "Cologny","Confignon","Corsier","Dardagny","Genève-Ville",
            "Genthod","Grand-Saconnex","Gy","Hermance","Jussy","Laconnex",
            "Lancy","Meinier","Meyrin","Onex","Perly-Certoux",
            "Plan-les-Ouates","Pregny-Chambésy","Presinge","Puplinge",
            "Russin","Satigny","Soral","Thônex","Troinex","Vandoeuvres",
            "Vernier","Versoix","Veyrier"
      ]
    },
    product:{
      location:["Appenzell Rhodes-Extérieures",
                "Appenzell Rhodes-Intérieures",
                "Argovie",
                "Bâle-Campagne",
                "Bâle-Ville",
                "Berne",
                "Fribourg",
                "Genève",
                "Glaris",
                "Grisons",
                "Jura",
                "Lucerne",
                "Neuchâtel",
                "Nidwald",
                "Obwald",
                "Saint-Gall",
                "Schaffhouse",
                "Schwyz",
                "Soleure",
                "Tessin",
                "Thurgovie",
                "Uri",
                "Valais",
                "Vaud",
                "Zoug",
                "Zurich"]
    },
    order:{
      financialstatus:["pending",
                       "authorized",
                       "partially_paid",
                       "paid",
                       "partially_refunded",
                       "refunded",
                       "voided"
      ],
      cancelreason:["customer", "fraud", "inventory", "other"],
      status:["created","partial","fulfilled", "failure"],
      gateway:[ "postfinance", "paypal"],
      shippingmode:["karibou", "none"]
    }
  },

  mail:{
    from:'james@karibou.evaletolab.ch',
    to:'james@karibou.evaletolab.ch',
    ttl:{long:24,short:1},
    site:'http://lo.cal:3000',
    default:'mandril',
    mandril:{    
      host:'smtp.mandrillapp.com',
      port:587,
      user:'evaleto@gmail.com',
      code:'Y6UqPC6BpB9YZFX-Wv2yyw'
    }
  },
  admin:{
    emails:['evaleto@gmail.com']
  },
  
  cors:{
    allowedDomains:['http://lo.cal:3000'],
    credentials:true,
    age:3600
  },

  express: {
    port: process.env.PORT || 4000,
    views: PATH('views'),
    'view engine': 'jade'
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
        httpOnly: true,
        maxAge: 1000 * 60 * 30 * 24 * 60 // = 60 days (in miliseconds)
      }
    },

    csrf: {}
	}
};
