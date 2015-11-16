
var ObjectId = require('mongoose').Schema.Types.ObjectID;

// 12345 ==> evaleto@gluck.com 
// 12346 ==> evaleto@gmail.com
// 12347 ==> delphine@gmail.com

exports.Wallets=[{    
  id:'12345',
  apikey:config.payment.wallet.apikey,
  description: 'this is a demo wallet',
  email: 'evaleto@gluck.com',
  card:{ 
    last4: '4657',
    number: '4091517362214657',
    expiry: new Date('Tue Nov 08 2016 23:59:00 GMT+0100 (CET)') 
  },
  external_account: {
    name:'Demo Wallet',
    iban:'BE68539007547034'
  },
  transfers_enabled:false,
  transfers: [],
  transactions: [],
  created: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  updated: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  balance: 0,
  wid: 'wa_1234567890'
},
{    
  id:'12346',
  apikey:config.payment.wallet.apikey,
  description: 'this is a demo wallet',
  email: 'evaleto@gmail.com',
  card:{ 
    last4: '1520',
    number: '4091002818331520',
    expiry: new Date('Tue Nov 08 2016 23:59:00 GMT+0100 (CET)') 
  },
  external_account: {
    name:'Demo Wallet',
    iban:'BE68539007547034'
  },
  transfers_enabled:false,
  transfers: [],
  transactions: [],
  created: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  updated: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  balance: 0,
  wid: 'wa_1234567891'
},
{    
  id:'12347',
  apikey:config.payment.wallet.apikey,
  description: 'this is a demo wallet',
  email: 'delphine@gmail.com',
  card:{ 
    last4: '1282',
    number: '2923209776891282',
    expiry: new Date('Tue Nov 08 2016 23:59:00 GMT+0100 (CET)') 
  },
  external_account: {
    name:'Demo Wallet',
    iban:'BE68539007547034'
  },
  transfers_enabled:false,
  transfers: [],
  transactions: [],
  created: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  updated: new Date('Mon Nov 09 2015 08:20:21 GMT+0100 (CET)'),
  balance: 0,
  wid: 'wa_1234567892'
}];



