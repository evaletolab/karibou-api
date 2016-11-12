var ObjectId = require('mongodb').ObjectID;
var c=require('./Categories');
var u=require('./Users');
var orders = require('mongoose').model('Orders');

// this fixture focus on order with 
//  - different dates (today, next shipping day, next week), 
//  - config.shared.financialstatus  ("pending","authorized","partially_paid","paid", "partially_refunded" ...)
//  - config.shared.cancelreason ("customer", "fraud", "inventory", "other")
//  - config.shared.status ("fulfilled","partial","fulfilled", "shipped","failure")
//
// build orders with
//  - 2 users
//  - all products, stock, shop, user ... are available
//  -

var oneweek=orders.findOneWeekOfShippingDay();
var firstDayOfMonth=orders.findCurrentShippingDay();
var lastDayOfMonth=new Date(firstDayOfMonth);
var customerDay=oneweek[0];

var passedday=new Date(customerDay.getTime()-86400000*7)

lastDayOfMonth.setDate(lastDayOfMonth.daysInMonth());
lastDayOfMonth.setHours(22,0,0,0);

firstDayOfMonth.setDate(1);
firstDayOfMonth.setHours(16,0,0,0);

exports.Orders=[
{
  "oid": 2000606,
  "email": "fabio.loverso@lacite.info",
  "payment": {
    "alias": "1ee6598575d58146b8f2930cb27c7bf343fd7c7e5b00cce546de64505b9a660caadd4023b2d479737d46dc4c56329fc0f218d6b8c9f76385beb44bb112908c7c42aad08d2e2df87de23e60d9e91de38c0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-9908",
    "issuer": "visa",
    "expiry": "2/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 72.85 the Sat Jan 17 1970 20:54:32 GMT+0100 (CET)",
      "capture 72.85 the Sat Jan 17 1970 20:54:32 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "d6dd5123617e4baf299c42508d401fd11293afc8b058d3ef60159b526ed73b550e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-29T13:00:37.252Z",
  "closed": "2016-02-02T18:08:06.155Z",
  "items": [
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "lo verso fabio",
    "note": "Interphone",
    "streetAdress": "15b, rue des noirettes",
    "floor": "2",
    "postalCode": "1227",
    "region": "Carouge,GE",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.18884449999999,
      "lng": 6.135447999999999
    },
    "bags": 1
  },
  "sum": 8.6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000607,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 51.2 the Sat Jan 17 1970 20:56:16 GMT+0100 (CET)",
      "capture 51.2 the Sat Jan 17 1970 20:56:16 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "40cede733e46d457f2c72a51ee6f41cfe1d2157a4f8f443db85abcbd64789f000e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-30T18:02:50.882Z",
  "closed": "2016-02-02T18:08:09.024Z",
  "items": [
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 4,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Parmigiana d’aubergines",
      "sku": 1000310,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Quiche salée",
      "sku": 1000316,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "1 pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    },
    "bags": 1
  },
  "sum": 21,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000609,
  "email": "jeromebaudry23@yahoo.fr",
  "payment": {
    "alias": "051e533e83cee69ccde967a1806df4bc624c83ab0b9cea5c268ed92f20bcd51f1c5f3374e16f9e6f88e5a1220a42f36b597da6b1973e9cdcb4b7e43e68c7b351c8d886a157d7d9fe2df40cc7e130bab40e0e0e0e",
    "number": "xxxx-xxxx-xxxx-8598",
    "issuer": "visa",
    "expiry": "11/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 102.05 the Sat Jan 17 1970 20:57:11 GMT+0100 (CET)",
      "capture 102.05 the Sat Jan 17 1970 20:57:11 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "8ef79748c85d075f0665bd5c395360d0dc66678fca62ac4b0933da05056a73280e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-31T09:16:13.499Z",
  "closed": "2016-02-02T18:08:11.812Z",
  "items": [
    {
      "title": "Saint-félicien affiné",
      "sku": 1000206,
      "price": 7.4,
      "finalprice": 7.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Le Maréchal",
      "sku": 1000401,
      "price": 8.4,
      "finalprice": 9.3,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Bleu de Fribourg",
      "sku": 1000403,
      "price": 6.6,
      "finalprice": 6.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "colboc emmanuel",
    "note": "code 9660, 2e gauche",
    "streetAdress": "rue du vieux-billard 10",
    "floor": "2",
    "postalCode": "1205",
    "region": "Genève",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2005498,
      "lng": 6.1386011
    },
    "bags": 2
  },
  "sum": 23.300000000000004,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000610,
  "email": "consoli.fabio@gmail.com",
  "payment": {
    "alias": "9ac7ba5c4fab44542772afa1d24de39ff8c7dc9d83130b937eba4b597127467a2e59e5d6b628bfacfd5dfe40f29e63c25f9339a591a517732c236b7a961f65fdaddbd93984a57f4b833c139058f57f720e0e0e0e",
    "number": "xxxx-xxxx-xxxx-2331",
    "issuer": "visa",
    "expiry": "2/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 110.8 the Sat Jan 17 1970 20:57:43 GMT+0100 (CET)",
      "capture 110.8 the Sat Jan 17 1970 20:57:43 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "2d970eaa8a2d1c9f93c8dfeb8a07202945aa533dae5f2f8f7a7ad473f302d4e50e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-31T17:58:10.745Z",
  "closed": "2016-02-02T18:08:14.542Z",
  "items": [
    {
      "title": "Gruyère fruité (16 mois d'affinage)",
      "sku": 1000024,
      "price": 7.35,
      "finalprice": 7.35,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "consoli fabio",
    "note": "code: #7258",
    "streetAdress": "rue de carouge 72",
    "floor": "5",
    "postalCode": "1205",
    "region": "Genève",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1925523,
      "lng": 6.1437018
    },
    "bags": 1
  },
  "sum": 15.95,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000611,
  "email": "michele.terrier@hotmail.ch",
  "payment": {
    "alias": "bb3ddae9484bf3071571640bb378858f25383fdcc407871b3f5a432de1e5f482d1259cf65c4c34aea26de5d915a6f13912a015d252868622818103f53ae4cad859f08fcc411d05a2c5279c807114458d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-4279",
    "issuer": "mastercard",
    "expiry": "5/2016",
    "fees": {
      "shipping": 7.5
    },
    "logs": [
      "authorized amount 197.95 the Sat Jan 17 1970 20:57:45 GMT+0100 (CET)",
      "capture 197.95 the Sat Jan 17 1970 20:57:45 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "4b1987eba03955f1764c287e0b5b3de110ebffc84789ad74e0e70961b2fcc9720e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-31T18:35:00.221Z",
  "closed": "2016-02-02T18:08:17.607Z",
  "items": [
    {
      "title": "Petit caprèse  au chocolat noir",
      "sku": 1000306,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "2pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 8,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 2,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Quiche salée",
      "sku": 1000316,
      "price": 6,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "1 pce",
      "quantity": 2,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pate à tartiner chocolat noir/noisette",
      "sku": 1000436,
      "price": 15,
      "finalprice": 15,
      "vendor": "purogusto",
      "part": "200gr",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pain d’épices aux trois poivres",
      "sku": 1000439,
      "price": 12,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "450gr",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "pharmacie des bergues",
    "note": "Livrer directement à la pharmacie svp",
    "streetAdress": "25 quai des bergues",
    "floor": "Arcade",
    "postalCode": "1201",
    "region": "Genève",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2064842,
      "lng": 6.145340099999999
    },
    "bags": 2
  },
  "sum": 53,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000612,
  "email": "evaleto@gmail.com",
  "payment": {
    "alias": "fabdfe0d9a0b11b93b41af91de3a19f1be80a97f4c6a871a918c91f40d920876cf26fbd9524f3cb1650f04dd8e14151c925459d45c47051723cbf4ba0939926fae771ba981622fd1b4db2994020ed4540e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0347",
    "issuer": "visa",
    "expiry": "8/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 145 the Sat Jan 17 1970 20:57:53 GMT+0100 (CET)",
      "capture 145 the Sat Jan 17 1970 20:57:53 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "2e8b8352508341c279e9805917b499775c0718cba5306e929001ee5e65b1d6950e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-01-31T20:54:49.539Z",
  "closed": "2016-02-02T18:08:19.914Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Petit camembert",
      "sku": 1000027,
      "price": 6.5,
      "finalprice": 6.5,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 6.3,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Le Maréchal",
      "sku": 1000401,
      "price": 8.4,
      "finalprice": 8.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme fleurette",
      "sku": 1000404,
      "price": 5.1,
      "finalprice": 5.1,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "evalet olivier",
    "note": "code 1956",
    "streetAdress": "34 route chêne",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-02T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    },
    "bags": 2
  },
  "sum": 31.300000000000004,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000615,
  "email": "fauziah_yusoff@yahoo.fr",
  "payment": {
    "alias": "468e332b3065962edc22d8dc299ba127411ac0905bf5f13e22ad7efa9c64157d0a649fb5501de2ad388264c5064ceccff033c18a0c8bb26994af56ce0b9b63541969728f4eeaa26fdf2168e2318a0c120e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1406",
    "issuer": "visa",
    "expiry": "12/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 88.6 the Sat Jan 17 1970 21:00:29 GMT+0100 (CET)",
      "capture 88.6 the Sat Jan 17 1970 21:00:29 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "77b0d03bc2bdfcccba31a607b56a326b6bd636e4c8b1b8e3246b5a0ffb77f8bc0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-02T16:11:23.624Z",
  "closed": "2016-02-05T15:38:01.008Z",
  "items": [
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "gardaz fauziah",
    "note": "Il faut passer la porte vitrée et aller au bout de la coursive extérieure, à la dernière porte.",
    "streetAdress": "rue des délices 33",
    "floor": "5 ème",
    "postalCode": "1203",
    "region": "Genève",
    "when": "2016-02-05T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2081242,
      "lng": 6.1346232
    },
    "bags": 2
  },
  "sum": 6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000616,
  "email": "atank@infomaniak.ch",
  "payment": {
    "alias": "6f873b28c126d508e9f5402fa96b7446106bbfd31ce6c72a1050edab602bbea70a2858adde50b3cc5a4f580bc44d81426baab0dbe40cb611b4435dc6c58e0af976c97934fe487ba4ac2c3470ffa10a780e0e0e0e",
    "number": "xxxx-xxxx-xxxx-8674",
    "issuer": "mastercard",
    "expiry": "4/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 72.45 the Sat Jan 17 1970 21:00:45 GMT+0100 (CET)",
      "capture 72.45 the Sat Jan 17 1970 21:00:45 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "1734b3a56e762c8b86d858b054ee3e6ec0876447351845fd18f05a33dfdce7760e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-02T20:40:54.412Z",
  "closed": "2016-02-05T15:38:03.411Z",
  "items": [
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "tank anouk",
    "note": "code : 1009",
    "streetAdress": "48 rte de malagnou",
    "floor": "5e",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-05T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1966198,
      "lng": 6.162958199999999
    },
    "bags": 2
  },
  "sum": 14.6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000617,
  "email": "l.e.n.a@bluewin.ch",
  "payment": {
    "alias": "42631feb0d57a45413ffd1c494095df08da279789783d32f7f1527af2da352fdd58dc1be82b7348a1aa9114d6a41b439dc19d34d82d5f815cdc4b6466ba954ed15d3dde29ca92a4651fdd325da4525dc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-2572",
    "issuer": "mastercard",
    "expiry": "10/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 96.55 the Sat Jan 17 1970 21:00:54 GMT+0100 (CET)",
      "capture 96.55 the Sat Jan 17 1970 21:00:54 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "4082add094d8165bcdf4878fead1a4641e6927eb530bd7be9331c87727e966630e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-02T23:04:40.640Z",
  "closed": "2016-02-05T15:38:05.820Z",
  "items": [
    {
      "title": "Gruyère vieux (26 mois d'affinage)",
      "sku": 1000025,
      "price": 7.35,
      "finalprice": 7.35,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 7,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Mothais sur feuille",
      "sku": 1000400,
      "price": 7.4,
      "finalprice": 7.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "strasser léna",
    "note": "code 62354# (si pas là déposer devant la porte, merci)",
    "streetAdress": "rue de l'encyclopédie 20",
    "floor": "5eme",
    "postalCode": "1201",
    "region": "Genève",
    "when": "2016-02-05T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2062623,
      "lng": 6.1342436
    },
    "bags": 2
  },
  "sum": 21.75,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000618,
  "email": "annecanepa@gmail.com",
  "payment": {
    "alias": "e4579fa6dd094f952d055b39f0573a4f89926e8ae304e1cc3dabe47cf4ade8b9c31fa3e164059412a9d321725d8098faf853e1a960078f2e3f401d7b67c3bccfcf51071f8430ec0bb5987e50b444e26d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0119",
    "issuer": "visa",
    "expiry": "6/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 128.7 the Sat Jan 17 1970 21:01:52 GMT+0100 (CET)",
      "capture 128.7 the Sat Jan 17 1970 21:01:52 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "9d91941d3491e6eee8b176a992979da64e0f7dbfbbd5170be14e2debb6be55920e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-03T15:07:58.341Z",
  "closed": "2016-02-05T15:38:08.300Z",
  "items": [
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 5.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "canepa anne",
    "note": "appartement 52A",
    "streetAdress": "118 route de florissant",
    "floor": "5",
    "postalCode": "1206",
    "region": "Genève",
    "when": "2016-02-05T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1899536,
      "lng": 6.1663951
    },
    "bags": 1
  },
  "sum": 14.2,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000619,
  "email": "evaleto@gmail.com",
  "payment": {
    "alias": "fabdfe0d9a0b11b93b41af91de3a19f1be80a97f4c6a871a918c91f40d920876cf26fbd9524f3cb1650f04dd8e14151c925459d45c47051723cbf4ba0939926fae771ba981622fd1b4db2994020ed4540e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0347",
    "issuer": "visa",
    "expiry": "8/2016",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 122.45 the Sat Jan 17 1970 21:02:14 GMT+0100 (CET)",
      "capture 122.45 the Sat Jan 17 1970 21:02:14 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "8420307e7f750f61b845efc8120c68bd64ac3bc8d8d5cafc847f1be76de190550e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-03T21:22:41.735Z",
  "closed": "2016-02-05T15:38:10.779Z",
  "items": [
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 5.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "evalet olivier",
    "note": "code 1956",
    "streetAdress": "34 route chêne",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-05T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    }
  },
  "sum": 5.6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000624,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 152.15 the Sat Jan 17 1970 21:04:58 GMT+0100 (CET)",
      "capture 152.15 the Sat Jan 17 1970 21:04:58 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "d04bc7b431f429ed3dbd83687acdfd8305cc90179a9f4296031dfc89e55006260e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-05T18:57:26.281Z",
  "closed": "2016-02-09T16:56:08.788Z",
  "items": [
    {
      "title": "Gruyère vieux (26 mois d'affinage)",
      "sku": 1000025,
      "price": 7.35,
      "finalprice": 7.35,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-09T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    },
    "bags": 2
  },
  "sum": 7.35,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000625,
  "email": "annecanepa@gmail.com",
  "payment": {
    "alias": "e4579fa6dd094f952d055b39f0573a4f89926e8ae304e1cc3dabe47cf4ade8b9c31fa3e164059412a9d321725d8098faf853e1a960078f2e3f401d7b67c3bccfcf51071f8430ec0bb5987e50b444e26d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0119",
    "issuer": "visa",
    "expiry": "6/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 135.25 the Sat Jan 17 1970 21:06:01 GMT+0100 (CET)",
      "capture 135.25 the Sat Jan 17 1970 21:06:01 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "be00da0429fb364b718595503e34aa0c3a02d177269ebb23fdecaedf63b0d2b10e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-06T12:16:42.579Z",
  "closed": "2016-02-09T16:56:10.888Z",
  "items": [
    {
      "title": "Petit camembert",
      "sku": 1000027,
      "price": 6.5,
      "finalprice": 6.5,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Saint-félicien affiné",
      "sku": 1000206,
      "price": 7.4,
      "finalprice": 7.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "canepa anne",
    "note": "appartement 52A",
    "streetAdress": "118 route de florissant",
    "floor": "5",
    "postalCode": "1206",
    "region": "Genève",
    "when": "2016-02-09T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1899536,
      "lng": 6.1663951
    },
    "bags": 2
  },
  "sum": 13.9,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000626,
  "email": "leo@verhoeven.ch",
  "payment": {
    "alias": "0ed587ff30df4cd26fc021f49837aa559bd6c45c05f02415a5d28894d28638efb657a34ce2a0e0b9ea3c054a1b35f6c4150416e59eac0323bddb46e1843da23025f8e62b2f7275cb4516cf601d0e98f80e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0920",
    "issuer": "mastercard",
    "expiry": "8/2018",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 82.35 the Sat Jan 17 1970 21:07:44 GMT+0100 (CET)",
      "capture 82.35 the Sat Jan 17 1970 21:07:44 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "2f34a634d04a4e0e2bf25b28f309dbdfa3595e22ec51aa9b163511eb54091a710e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-07T16:58:16.197Z",
  "closed": "2016-02-09T16:56:13.382Z",
  "items": [
    {
      "title": "Brie à la farce truffée",
      "sku": 1000402,
      "price": 11.8,
      "finalprice": 11.8,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Vacherin de Fribourg",
      "sku": 1000408,
      "price": 5.6,
      "finalprice": 24.8,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 4,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Plaisir au Chablis",
      "sku": 1000488,
      "price": 10,
      "finalprice": 7.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "verhoeven simon",
    "note": "c/o Delphine et Olivier Avalet Cluzel",
    "streetAdress": "34 route de chene",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-09T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    }
  },
  "sum": 44,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000628,
  "email": "fm@fabiennemuller.ch",
  "payment": {
    "alias": "713dbef234f6be147f691ee4a58a5a52b2a2c8212999d2ff470dc17dbc1f201d3d817807fd037f87eba40919ec4dbef8b47089608bc47ffcb5c5be498019a2a372f710ad0976ec9a8b264c4265d9b8610e0e0e0e",
    "number": "xxxx-xxxx-xxxx-4646",
    "issuer": "mastercard",
    "expiry": "1/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 50.95 the Sat Jan 17 1970 21:07:56 GMT+0100 (CET)",
      "capture 50.95 the Sat Jan 17 1970 21:07:56 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "19bb5f7dcb1e4f121a38213fa023e045b5fff73bdf95712c2b0034b5724684650e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-07T20:15:36.373Z",
  "closed": "2016-02-09T16:56:17.937Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gruyère vieux (26 mois d'affinage)",
      "sku": 1000025,
      "price": 7.35,
      "finalprice": 7.1,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Bleu de Fribourg",
      "sku": 1000403,
      "price": 6.6,
      "finalprice": 6.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "muller fabienne",
    "note": "code 3315",
    "streetAdress": "rue des noirettes 13",
    "floor": "4ème",
    "postalCode": "1227",
    "region": "Carouge,GE",
    "when": "2016-02-09T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1892084,
      "lng": 6.135789099999999
    },
    "bags": 1
  },
  "sum": 18.7,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000632,
  "email": "delphine.cluzel@gmail.com",
  "payment": {
    "alias": "735356d2d3fac82c23da5e153ac79ce0df60c378b558c3986cd5741892fee1115e4321c83c364e03039063c68bdb13aec2d2f011005a6142e15307d0e45468a1f7291d6c5134b6d44592618040b5e0030e0e0e0e",
    "number": "xxxx-xxxx-xxxx-6190",
    "issuer": "visa",
    "expiry": "1/2019",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 67 the Sat Jan 17 1970 21:07:58 GMT+0100 (CET)",
      "capture 67 the Sat Jan 17 1970 21:07:58 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "2ae58bef917217ca3ead9354aabaa560f289056e9e5b47c8421f715a6d5be57a0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-07T21:01:18.559Z",
  "closed": "2016-02-09T16:56:27.375Z",
  "items": [
    {
      "title": "Tomme fleurette",
      "sku": 1000404,
      "price": 5.1,
      "finalprice": 5.1,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "cluzel evalet delphine",
    "note": "code d'entrée : 1956",
    "streetAdress": "route de chêne 34",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-09T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    }
  },
  "sum": 5.1,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000634,
  "email": "fauziah_yusoff@yahoo.fr",
  "payment": {
    "alias": "468e332b3065962edc22d8dc299ba127411ac0905bf5f13e22ad7efa9c64157d0a649fb5501de2ad388264c5064ceccff033c18a0c8bb26994af56ce0b9b63541969728f4eeaa26fdf2168e2318a0c120e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1406",
    "issuer": "visa",
    "expiry": "12/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 145.2 the Sat Jan 17 1970 21:09:09 GMT+0100 (CET)",
      "capture 145.2 the Sat Jan 17 1970 21:09:09 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "479cfba8b9c661056cfb3b447577dc634fff8f9902dfdcdb58b5d335125b91c60e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-08T16:40:41.316Z",
  "closed": "2016-02-12T16:20:38.297Z",
  "items": [
    {
      "title": "Gruyère fruité (16 mois d'affinage)",
      "sku": 1000024,
      "price": 7.35,
      "finalprice": 13.1,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 2,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "gardaz fauziah",
    "note": "Il faut passer la porte vitrée et aller au bout de la coursive extérieure, à la dernière porte.",
    "streetAdress": "rue des délices 33",
    "floor": "5 ème",
    "postalCode": "1203",
    "region": "Genève",
    "when": "2016-02-12T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2081242,
      "lng": 6.1346232
    }
  },
  "sum": 13.1,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000635,
  "email": "michele.terrier@hotmail.ch",
  "payment": {
    "alias": "bb3ddae9484bf3071571640bb378858f25383fdcc407871b3f5a432de1e5f482d1259cf65c4c34aea26de5d915a6f13912a015d252868622818103f53ae4cad859f08fcc411d05a2c5279c807114458d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-4279",
    "issuer": "mastercard",
    "expiry": "5/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 173.45 the Sat Jan 17 1970 21:10:03 GMT+0100 (CET)",
      "capture 173.45 the Sat Jan 17 1970 21:10:03 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "e282356bb0ab3728a283dde2159ee6eea99aeccabb729dff70d7d59dbdccd8100e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-09T07:30:46.661Z",
  "closed": "2016-02-12T16:20:41.486Z",
  "items": [
    {
      "title": "Lasagne",
      "sku": 1000308,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Lasagne épinards-ricotta"
      }
    },
    {
      "title": "Lasagne",
      "sku": 1000308,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Lasagne tomates-mozzarella"
      }
    },
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 4,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Parmigiana d’aubergines",
      "sku": 1000310,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Muffin salé (naturellement sans gluten)",
      "sku": 1000314,
      "price": 5,
      "finalprice": 5,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Courgettes, pesto"
      }
    },
    {
      "title": "Quiche salée",
      "sku": 1000316,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "1 pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "pharmacie des bergues",
    "note": "Livrer directement à la pharmacie svp",
    "streetAdress": "25 quai des bergues",
    "floor": "Arcade",
    "postalCode": "1201",
    "region": "Genève",
    "when": "2016-02-12T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2064842,
      "lng": 6.145340099999999
    }
  },
  "sum": 54,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000638,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 5
    },
    "logs": [
      "authorized amount 227.75 the Sat Jan 17 1970 21:10:31 GMT+0100 (CET)",
      "capture 227.75 the Sat Jan 17 1970 21:10:31 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "c554f7e08d4ef31aa1dd3fe5b75e6aa28b3467f7a2292f2f4303bb76f9d83cc90e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-09T15:22:34.703Z",
  "closed": "2016-02-12T16:20:44.186Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gruyère vieux (26 mois d'affinage)",
      "sku": 1000025,
      "price": 7.35,
      "finalprice": 7.35,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Chèvre frais",
      "sku": 1000205,
      "price": 4.9,
      "finalprice": 4.9,
      "vendor": "les-fromages-de-gaetan",
      "part": "~150gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 4,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Raclette St-Theodule",
      "sku": 1000399,
      "price": 4.05,
      "finalprice": 69.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~150gr",
      "quantity": 16,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-12T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    }
  },
  "sum": 90.85,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000645,
  "email": "michele.terrier@hotmail.ch",
  "payment": {
    "alias": "bb3ddae9484bf3071571640bb378858f25383fdcc407871b3f5a432de1e5f482d1259cf65c4c34aea26de5d915a6f13912a015d252868622818103f53ae4cad859f08fcc411d05a2c5279c807114458d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-4279",
    "issuer": "mastercard",
    "expiry": "5/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 83.4 the Sat Jan 17 1970 21:17:59 GMT+0100 (CET)",
      "capture 83.4 the Sat Jan 17 1970 21:17:59 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "50cb32d6f480aa33aa661f9d55dafa9444ece6c1653940404b589b84154f24d00e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-14T19:51:31.048Z",
  "closed": "2016-02-16T15:13:52.512Z",
  "items": [
    {
      "title": "Petit caprèse  au chocolat noir",
      "sku": 1000306,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "2pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Lasagne",
      "sku": 1000308,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Lasagne tomates-mozzarella"
      }
    },
    {
      "title": "Quiche salée",
      "sku": 1000316,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "1 pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "pharmacie des bergues",
    "note": "Livrer directement à la pharmacie svp",
    "streetAdress": "25 quai des bergues",
    "floor": "Arcade",
    "postalCode": "1201",
    "region": "Genève",
    "when": "2016-02-16T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2064842,
      "lng": 6.145340099999999
    },
    "bags": 1
  },
  "sum": 23,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000646,
  "email": "evaleto@gmail.com",
  "payment": {
    "alias": "fabdfe0d9a0b11b93b41af91de3a19f1be80a97f4c6a871a918c91f40d920876cf26fbd9524f3cb1650f04dd8e14151c925459d45c47051723cbf4ba0939926fae771ba981622fd1b4db2994020ed4540e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0347",
    "issuer": "visa",
    "expiry": "8/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 155.5 the Sat Jan 17 1970 21:18:01 GMT+0100 (CET)",
      "capture 155.5 the Sat Jan 17 1970 21:18:01 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "8a06d764d7b6365df59908fd6cbbd9d1c2f0b587628809e303906d8a6921aa270e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-14T20:24:08.726Z",
  "closed": "2016-02-16T15:13:54.166Z",
  "items": [
    {
      "title": "Tiramisu",
      "sku": 1000307,
      "price": 10,
      "finalprice": 10,
      "vendor": "purogusto",
      "part": "~160gr",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "evalet olivier",
    "note": "code 1956",
    "streetAdress": "34 route chêne",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-16T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    },
    "bags": 2
  },
  "sum": 10,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000649,
  "email": "atank@infomaniak.ch",
  "payment": {
    "alias": "6f873b28c126d508e9f5402fa96b7446106bbfd31ce6c72a1050edab602bbea70a2858adde50b3cc5a4f580bc44d81426baab0dbe40cb611b4435dc6c58e0af976c97934fe487ba4ac2c3470ffa10a780e0e0e0e",
    "number": "xxxx-xxxx-xxxx-8674",
    "issuer": "mastercard",
    "expiry": "4/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 64 the Sat Jan 17 1970 21:20:13 GMT+0100 (CET)",
      "capture 64 the Sat Jan 17 1970 21:20:13 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "5c2479a8c733bb5df4114a37eb20557f8522ef2f3e3e98138414f281b1d357320e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-16T09:03:28.852Z",
  "closed": "2016-02-19T15:19:51.923Z",
  "items": [
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "tank anouk",
    "note": "code : 1009",
    "streetAdress": "48 rte de malagnou",
    "floor": "5e",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1966198,
      "lng": 6.162958199999999
    },
    "bags": 1
  },
  "sum": 6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000650,
  "email": "mahazein@gmail.com",
  "payment": {
    "alias": "22c9551789fd6b209d9ca3fd05084b07d403386773c5a6dc1bd097192be0f0a736caf1575b6e0324f2ee3881a30983621d8f00599a2244a9d133a26d629a8125082dc3aa1191e52a872052d54d08344b0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-7826",
    "issuer": "mastercard",
    "expiry": "11/2018",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 107.75 the Sat Jan 17 1970 21:20:23 GMT+0100 (CET)",
      "capture 107.75 the Sat Jan 17 1970 21:20:23 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "1acad1c0d04cd87eebc93cc836cf67a54ad0547bdedbad595c21d8cfa3b07cb30e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-16T11:59:27.186Z",
  "closed": "2016-02-19T15:19:57.791Z",
  "items": [
    {
      "title": "Mini chevrot",
      "sku": 1000020,
      "price": 4.9,
      "finalprice": 9.8,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 2,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gruyère fruité (16 mois d'affinage)",
      "sku": 1000024,
      "price": 7.35,
      "finalprice": 7.8,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Ossau-iraty",
      "sku": 1000028,
      "price": 6.6,
      "finalprice": 6.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "zein maha",
    "streetAdress": "bergalonne 12",
    "floor": "1",
    "postalCode": "1205",
    "region": "Genève",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1980284,
      "lng": 6.1376249
    }
  },
  "sum": 30.200000000000003,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000651,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 62.45 the Sat Jan 17 1970 21:20:34 GMT+0100 (CET)",
      "capture 62.45 the Sat Jan 17 1970 21:20:34 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "e1a297e3f19adbbf12266fb209b4d0049d4eb936f3057624fffc523ea7b7ee520e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-16T14:52:25.315Z",
  "closed": "2016-02-19T15:20:01.048Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 4,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    },
    "bags": 1
  },
  "sum": 9,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000652,
  "email": "peczelyl@hotmail.com",
  "payment": {
    "alias": "880f1c5a118400b2a9b74f5e6817e66444a63f23510fad888cb8a00866ea007912b7a2f824681afa057fd4a3f837e74a798aa7df83bc4300a745c5f35e99b52825f7a6055e75bcaa81fb06ac406f88940e0e0e0e",
    "number": "xxxx-xxxx-xxxx-0887",
    "issuer": "mastercard",
    "expiry": "11/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 132.55 the Sat Jan 17 1970 21:21:40 GMT+0100 (CET)",
      "capture 132.55 the Sat Jan 17 1970 21:21:40 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "30b0c32ed9cd367c852450280f3efe0f56c7a4d6a415cee9ef7c80f1cb335ca90e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-17T09:08:57.631Z",
  "closed": "2016-02-19T15:20:03.239Z",
  "items": [
    {
      "title": "Vacherin de Fribourg",
      "sku": 1000408,
      "price": 5.6,
      "finalprice": 6.3,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "peczely lilla sara",
    "note": "Doorcode 2692E; 5th floor; please leave it in front of the door. Code de la porte 2692 de E; 5ème étage; laissez s'il vous plaît en face de la porte",
    "streetAdress": "24 rue jacques grosselin",
    "floor": "5 (2692E)",
    "postalCode": "1227",
    "region": "Carouge,GE",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.185955,
      "lng": 6.13531
    },
    "bags": 1
  },
  "sum": 6.3,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000653,
  "email": "frederique.bouchet@gmail.com",
  "payment": {
    "alias": "a26d947073c6d8e4d19013ab4c5b8a833e36f537705667fb7f9d393eae0693f0e389bd131148d94bafafe7951b983af612b67d637a9ed1cbff06e11dd3f90da40fa9b23ffe427227e0120a442f25d5080e0e0e0e",
    "number": "xxxx-xxxx-xxxx-8691",
    "issuer": "visa",
    "expiry": "5/2016",
    "fees": {
      "shipping": 7.5
    },
    "logs": [
      "authorized amount 179.95 the Sat Jan 17 1970 21:21:41 GMT+0100 (CET)",
      "capture 179.95 the Sat Jan 17 1970 21:21:41 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "8f76b8c1d24abb3ff54676e037e1952e354197c8e6c7958e531a9e49efe172fa0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-17T09:31:58.698Z",
  "closed": "2016-02-19T15:20:05.870Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Morbier",
      "sku": 1000026,
      "price": 5.4,
      "finalprice": 5.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Ossau-iraty",
      "sku": 1000028,
      "price": 6.6,
      "finalprice": 7.7,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "bouchet frédérique",
    "note": "jusqu'à 17h30, livraison à Ushitomi. Dès 17h30, livraison à la maison. Merci!",
    "streetAdress": "rue ferrier 10",
    "floor": "4ème étage",
    "postalCode": "1202",
    "region": "Genève",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2157484,
      "lng": 6.146484399999999
    },
    "bags": 2
  },
  "sum": 18.1,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000655,
  "email": "delphine.cluzel@gmail.com",
  "payment": {
    "alias": "735356d2d3fac82c23da5e153ac79ce0df60c378b558c3986cd5741892fee1115e4321c83c364e03039063c68bdb13aec2d2f011005a6142e15307d0e45468a1f7291d6c5134b6d44592618040b5e0030e0e0e0e",
    "number": "xxxx-xxxx-xxxx-6190",
    "issuer": "visa",
    "expiry": "1/2019",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 107.35 the Sat Jan 17 1970 21:22:25 GMT+0100 (CET)",
      "capture 107.35 the Sat Jan 17 1970 21:22:25 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "5f0e687f38fd8e1bd961a9a80052ed2f7f2132625c77c41aa6be166b6afa397b0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-17T21:51:31.513Z",
  "closed": "2016-02-19T15:20:19.782Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Petit camembert",
      "sku": 1000027,
      "price": 6.5,
      "finalprice": 6.5,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 5.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Le Maréchal",
      "sku": 1000401,
      "price": 8.4,
      "finalprice": 8.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme fleurette",
      "sku": 1000404,
      "price": 5.1,
      "finalprice": 5.1,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "cluzel evalet delphine",
    "note": "code d'entrée : 1956",
    "streetAdress": "route de chêne 34",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-19T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    },
    "bags": 1
  },
  "sum": 30.6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000657,
  "email": "delphine.cluzel@gmail.com",
  "payment": {
    "alias": "735356d2d3fac82c23da5e153ac79ce0df60c378b558c3986cd5741892fee1115e4321c83c364e03039063c68bdb13aec2d2f011005a6142e15307d0e45468a1f7291d6c5134b6d44592618040b5e0030e0e0e0e",
    "number": "xxxx-xxxx-xxxx-6190",
    "issuer": "visa",
    "expiry": "1/2019",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 151.1 the Sat Jan 17 1970 21:28:08 GMT+0100 (CET)",
      "capture 151.1 the Sat Jan 17 1970 21:28:08 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "e528b15229dee5f6c303873fc8cff7a00acd848d9b053ca8fc902a4ac55064590e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-21T21:09:16.637Z",
  "closed": "2016-02-23T19:26:00.610Z",
  "items": [
    {
      "title": "Laious de brebis",
      "sku": 1000022,
      "price": 10,
      "finalprice": 10,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Le Maréchal",
      "sku": 1000401,
      "price": 8.4,
      "finalprice": 11.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pizza Margherita de farine mi-blanche",
      "sku": 1000522,
      "price": 10,
      "finalprice": 10,
      "vendor": "purogusto",
      "part": "~450g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pizza de farine mi-blanche aux légumes grillés",
      "sku": 1000523,
      "price": 12,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "~550g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "cluzel evalet delphine",
    "note": "code d'entrée : 1956",
    "streetAdress": "route de chêne 34",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-23T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    },
    "bags": 1
  },
  "sum": 43.4,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000658,
  "email": "jean.terrier@bluewin.ch",
  "payment": {
    "alias": "77cb50d4d904a15e52f6a5aea1b22760f14904b4f640eb223a44b155a422f9d258a8f19010e184ec75e791f853a737b5b8713b6a97b1dc58160d89685190b5a55ce7f93fd60e36788c339997526a5f5e0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-9568",
    "issuer": "mastercard",
    "expiry": "5/2016",
    "fees": {
      "shipping": 7.5
    },
    "logs": [
      "authorized amount 181.6 the Sat Jan 17 1970 21:28:10 GMT+0100 (CET)",
      "capture 181.6 the Sat Jan 17 1970 21:28:10 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "f06ed77e0784886e2c5589214644e7a7d21d168f108b3e4481cc027799e277ca0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-21T21:30:46.323Z",
  "closed": "2016-02-23T19:26:03.664Z",
  "items": [
    {
      "title": "Mini chevrot",
      "sku": 1000020,
      "price": 4.9,
      "finalprice": 9.8,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 2,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "terrier jean",
    "note": "Code d'entrée: 1942",
    "streetAdress": "1 rue marignac",
    "floor": "5",
    "postalCode": "1206",
    "region": "Genève",
    "when": "2016-02-23T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1944086,
      "lng": 6.153050599999999
    },
    "bags": 2
  },
  "sum": 9.8,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000659,
  "email": "jessica.loiseau@bluewin.ch",
  "payment": {
    "alias": "0b9573485de95271dc061cfb4383fc5396022dc39ad214b47a6b06090f6f410beadf667c1556f8e57623d4d47e11379b3d6f22159f41c2b668ad51e80e5c9b533876f68417546946a2f8072d5a1e5be50e0e0e0e",
    "number": "xxxx-xxxx-xxxx-6833",
    "issuer": "visa",
    "expiry": "10/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 74.65 the Sat Jan 17 1970 21:29:14 GMT+0100 (CET)",
      "capture 74.65 the Sat Jan 17 1970 21:29:14 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "b30631d097e334e52267a33807fe11fef4870f99482d10bac3e117bd6e8bc1420e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-22T15:20:24.037Z",
  "closed": "2016-02-26T16:40:18.694Z",
  "items": [
    {
      "title": "Gruyère fruité (16 mois d'affinage)",
      "sku": 1000024,
      "price": 7.35,
      "finalprice": 7.35,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tiramisu",
      "sku": 1000307,
      "price": 10,
      "finalprice": 10,
      "vendor": "purogusto",
      "part": "~160gr",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Muffin salé (naturellement sans gluten)",
      "sku": 1000314,
      "price": 5,
      "finalprice": 5,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Olives noires, feta, tomates cerises"
      }
    },
    {
      "title": "Muffin salé (naturellement sans gluten)",
      "sku": 1000314,
      "price": 5,
      "finalprice": 5,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Courgettes, pesto"
      }
    }
  ],
  "shipping": {
    "name": "loiseau jessica",
    "note": "Code entrée:9621",
    "streetAdress": "16, avenue peschier",
    "floor": "5",
    "postalCode": "1206",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1919862,
      "lng": 6.156799899999999
    }
  },
  "sum": 27.35,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000660,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 7
    },
    "logs": [
      "authorized amount 90.1 the Sat Jan 17 1970 21:30:59 GMT+0100 (CET)",
      "capture 90.1 the Sat Jan 17 1970 21:30:59 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "53d51f18230d868016531b3e3d55238b54846ea7969fe11c3b8c1ec49a683b3a0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-23T20:38:43.790Z",
  "closed": "2016-02-26T16:40:20.242Z",
  "items": [
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 5.9,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    }
  },
  "sum": 5.9,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000661,
  "email": "francois@monpetitcoin.com",
  "payment": {
    "alias": "0f31191c99fea2fc5d748193844c53fe569dfc9f7fe2233f28053be20621ab1faae1ef29cb75ce4054064c4ab9b5ff17210d5a84143942559d0db86a57e553a52f071c7c31641114ad4e5369e0b696bf0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-2594",
    "issuer": "mastercard",
    "expiry": "11/2018",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 71.55 the Sat Jan 17 1970 21:31:00 GMT+0100 (CET)",
      "capture 71.55 the Sat Jan 17 1970 21:31:00 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "ff7207543d09e157fa6ce7787b4271082c78becd22a1498d487d07f2c56c85eb0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-23T20:54:42.640Z",
  "closed": "2016-02-26T16:40:21.737Z",
  "items": [
    {
      "title": "Pizza de farine mi-blanche aux légumes grillés",
      "sku": 1000523,
      "price": 12,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "~550g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "suter françois",
    "note": "c/o Cobweb (je fais livrer au bureau, j'espère que vous passez pendant les heures de travail)",
    "streetAdress": "route des jeunes 5c",
    "floor": "4",
    "postalCode": "1227",
    "region": "Carouge,GE",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1917601,
      "lng": 6.1285121
    }
  },
  "sum": 12,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000662,
  "email": "michele.terrier@hotmail.ch",
  "payment": {
    "alias": "bb3ddae9484bf3071571640bb378858f25383fdcc407871b3f5a432de1e5f482d1259cf65c4c34aea26de5d915a6f13912a015d252868622818103f53ae4cad859f08fcc411d05a2c5279c807114458d0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-4279",
    "issuer": "mastercard",
    "expiry": "5/2016",
    "fees": {
      "shipping": 5
    },
    "logs": [
      "authorized amount 233.25 the Sat Jan 17 1970 21:31:02 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "96d97472e419f8b30413d68896d44ea38829d751520d233008af3d0dbcdd72280e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-23T21:20:48.637Z",
  "closed": "2016-04-01T21:20:48.637Z",
  "items": [
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Petit caprèse  au chocolat noir",
      "sku": 1000306,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "2pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Lasagne",
      "sku": 1000308,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Lasagne tomates-mozzarella"
      }
    },
    {
      "title": "Lasagne",
      "sku": 1000308,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "**Nouveauté** Lasagne courgettes-pesto"
      }
    },
    {
      "title": "Gâteau à l’orange",
      "sku": 1000309,
      "price": 4,
      "finalprice": 4,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Douceurs & chocolats",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Parmigiana d’aubergines",
      "sku": 1000310,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Muffin salé (naturellement sans gluten)",
      "sku": 1000314,
      "price": 5,
      "finalprice": 5,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Olives noires, feta, tomates cerises"
      }
    },
    {
      "title": "Muffin salé (naturellement sans gluten)",
      "sku": 1000314,
      "price": 5,
      "finalprice": 5,
      "vendor": "purogusto",
      "part": "1pce",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      },
      "variant": {
        "title": "Courgettes, pesto"
      }
    }
  ],
  "shipping": {
    "name": "pharmacie des bergues",
    "note": "Livrer directement à la pharmacie svp",
    "streetAdress": "25 quai des bergues",
    "floor": "Arcade",
    "postalCode": "1201",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2064842,
      "lng": 6.145340099999999
    }
  },
  "sum": 67.6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000664,
  "email": "christine.heilmann@frantour.ch",
  "payment": {
    "alias": "60562d3543946d58a829466ec40f7261afd0ba39a4e146bae2d31715ec17370c5bf4dd2745afedc86b580243e6ad9db955f3836a26568004c3f3f0bd62e0e941b4d5b36f6602c6a0d9729d24531c94c80e0e0e0e",
    "number": "xxxx-xxxx-xxxx-3265",
    "issuer": "visa",
    "expiry": "6/2017",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 148.55 the Sat Jan 17 1970 21:31:09 GMT+0100 (CET)",
      "capture 148.55 the Sat Jan 17 1970 21:31:09 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "affbb816ddfde1c0dc7e1d9a8dcff079a6b174b235ce029a3da324782e8b18d50e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-23T23:18:26.892Z",
  "closed": "2016-02-26T16:40:28.641Z",
  "items": [
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 17.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pâtes de blé BIO avec sauce tomate",
      "sku": 1000519,
      "price": 13,
      "finalprice": 13,
      "vendor": "purogusto",
      "part": "750g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pizza de farine mi-blanche aux légumes grillés",
      "sku": 1000523,
      "price": 12,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "~550g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "heilmann christine",
    "note": "Interphone",
    "streetAdress": "16 chemin des tulipiers",
    "floor": "4",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2011968,
      "lng": 6.173349099999999
    }
  },
  "sum": 42.4,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000665,
  "email": "atank@infomaniak.ch",
  "payment": {
    "alias": "6f873b28c126d508e9f5402fa96b7446106bbfd31ce6c72a1050edab602bbea70a2858adde50b3cc5a4f580bc44d81426baab0dbe40cb611b4435dc6c58e0af976c97934fe487ba4ac2c3470ffa10a780e0e0e0e",
    "number": "xxxx-xxxx-xxxx-8674",
    "issuer": "mastercard",
    "expiry": "4/2016",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 60.6 the Sat Jan 17 1970 21:31:46 GMT+0100 (CET)",
      "capture 60.6 the Sat Jan 17 1970 21:31:46 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "a90267ddaa9e74ea12d6a3b92d49621085744c4a7c37b3fee19f693a5504c8c10e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-24T09:40:42.811Z",
  "closed": "2016-02-26T16:40:30.154Z",
  "items": [
    {
      "title": "Pain naturellement sans gluten",
      "sku": 1000313,
      "price": 6,
      "finalprice": 6,
      "vendor": "purogusto",
      "part": "~900gr",
      "quantity": 1,
      "category": "Boulangerie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "tank anouk",
    "note": "code : 1009",
    "streetAdress": "48 rte de malagnou",
    "floor": "5e",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1966198,
      "lng": 6.162958199999999
    }
  },
  "sum": 6,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000666,
  "email": "elidesign@infomaniak.ch",
  "payment": {
    "alias": "45078aa35123c6977224430a5ff762631eb8a9673d98c39c3f7f885b04a6a132c37ccca8e1fd3dde564337be6341abbb3b876f333c9d9e3acb7e83cfa5010cda1caae01dd2cbb610569d3055c8b8c4bc0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-1337",
    "issuer": "mastercard",
    "expiry": "9/2018",
    "fees": {
      "shipping": 7.5
    },
    "logs": [
      "authorized amount 181.8 the Sat Jan 17 1970 21:31:56 GMT+0100 (CET)",
      "capture 181.8 the Sat Jan 17 1970 21:31:56 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "f2dd8438554b98e89ec1fb759c1d6fed3e98fee667a5ad0bc631969c5cd2616b0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-24T12:23:04.693Z",
  "closed": "2016-02-26T16:40:42.181Z",
  "items": [
    {
      "title": "Ossau-iraty",
      "sku": 1000028,
      "price": 6.6,
      "finalprice": 6.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Chèvre frais",
      "sku": 1000205,
      "price": 4.9,
      "finalprice": 4.9,
      "vendor": "les-fromages-de-gaetan",
      "part": "~150gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Saint-félicien affiné",
      "sku": 1000206,
      "price": 7.4,
      "finalprice": 7.4,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Parmigiana d’aubergines",
      "sku": 1000310,
      "price": 11,
      "finalprice": 11,
      "vendor": "purogusto",
      "part": "250gr",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "ascari varady elisabeth",
    "note": "--- La livraison : Mme ASCARI GRAZIELLA le code d'entrée après 17h00 - 7356",
    "streetAdress": "20 a avenue du bouchet",
    "floor": "3",
    "postalCode": "1209",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.2185013,
      "lng": 6.122540799999999
    }
  },
  "sum": 29.9,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000667,
  "email": "carinefluckiger@hotmail.com",
  "payment": {
    "alias": "a27ffaae01cf520e898d0874489d2cbaa93a9b0ce65ed334d38cc12fec2b75190e0e0e0e",
    "number": null,
    "issuer": "invoice",
    "expiry": "12/2016",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 167 the Wed Feb 24 2016 18:04:34 GMT+0100 (CET)",
      "invoice 131.8 the Fri Feb 26 2016 17:40:42 GMT+0100 (CET)",
      "captured 131.8 the Mon Mar 07 2016 15:41:50 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "c5165adb44cd1fa443c6ad3c0a64312f0e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-24T17:04:33.873Z",
  "closed": "2016-03-07T14:41:50.720Z",
  "items": [
    {
      "title": "Laious de brebis",
      "sku": 1000022,
      "price": 10,
      "finalprice": 10,
      "vendor": "les-fromages-de-gaetan",
      "part": "~300gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Petit camembert",
      "sku": 1000027,
      "price": 6.5,
      "finalprice": 6.5,
      "vendor": "les-fromages-de-gaetan",
      "part": "1pce",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pâtes d'épeautre BIO avec sauce noix",
      "sku": 1000521,
      "price": 18,
      "finalprice": 18,
      "vendor": "purogusto",
      "part": "750g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "fluckiger carine",
    "note": "Code d'immeuble: 0589#",
    "streetAdress": "quai du cheval-blanc 18",
    "floor": "rez",
    "postalCode": "1227",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1916334,
      "lng": 6.1393324
    }
  },
  "sum": 34.5,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000668,
  "email": "mahazein@gmail.com",
  "payment": {
    "alias": "22c9551789fd6b209d9ca3fd05084b07d403386773c5a6dc1bd097192be0f0a736caf1575b6e0324f2ee3881a30983621d8f00599a2244a9d133a26d629a8125082dc3aa1191e52a872052d54d08344b0e0e0e0e",
    "number": "xxxx-xxxx-xxxx-7826",
    "issuer": "mastercard",
    "expiry": "11/2018",
    "fees": {
      "shipping": 0
    },
    "logs": [
      "authorized amount 88.05 the Sat Jan 17 1970 21:32:16 GMT+0100 (CET)",
      "capture 88.05 the Sat Jan 17 1970 21:32:16 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "a32dd7739194db9241095c775d2856f59af3338778199aa553395062470b67800e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-24T18:00:43.585Z",
  "closed": "2016-02-26T16:40:45.119Z",
  "items": [
    {
      "title": "Pâtes d'épeautre BIO avec sauce noix",
      "sku": 1000521,
      "price": 18,
      "finalprice": 18,
      "vendor": "purogusto",
      "part": "750g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Pizza de farine mi-blanche aux légumes grillés",
      "sku": 1000523,
      "price": 12,
      "finalprice": 12,
      "vendor": "purogusto",
      "part": "~550g",
      "quantity": 1,
      "category": "Traiteur",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "zein maha",
    "streetAdress": "bergalonne 12",
    "floor": "1",
    "postalCode": "1205",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1980284,
      "lng": 6.1376249
    }
  },
  "sum": 30,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
},
{
  "oid": 2000669,
  "email": "delphine.cluzel@gmail.com",
  "payment": {
    "alias": "735356d2d3fac82c23da5e153ac79ce0df60c378b558c3986cd5741892fee1115e4321c83c364e03039063c68bdb13aec2d2f011005a6142e15307d0e45468a1f7291d6c5134b6d44592618040b5e0030e0e0e0e",
    "number": "xxxx-xxxx-xxxx-6190",
    "issuer": "visa",
    "expiry": "1/2019",
    "fees": {
      "shipping": 10
    },
    "logs": [
      "authorized amount 172.85 the Sat Jan 17 1970 21:32:26 GMT+0100 (CET)",
      "capture 172.85 the Sat Jan 17 1970 21:32:26 GMT+0100 (CET)"
    ],
    "provider": "stripe",
    "handle": "secret",
    "status": "paid",
    "transaction": "b892553d921b294566fd06d6e041c18420f0f56a199188a0ab007ed7b2acaa850e0e0e0e"
  },
  "fulfillments": {
    "status": "fulfilled"
  },
  "created": "2016-02-24T20:38:07.233Z",
  "closed": "2016-02-26T16:40:47.322Z",
  "items": [
    {
      "title": "Beurre en motte",
      "sku": 1000018,
      "price": 5,
      "finalprice": 5,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Tomme de Savoie AOC",
      "sku": 1000029,
      "price": 5.6,
      "finalprice": 5.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~200gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Viande séchée de Genève",
      "sku": 1000030,
      "price": 8.6,
      "finalprice": 8.6,
      "vendor": "les-fromages-de-gaetan",
      "part": "~100gr",
      "quantity": 1,
      "category": "Boucherie et charcuterie",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    },
    {
      "title": "Chèvre frais",
      "sku": 1000205,
      "price": 4.9,
      "finalprice": 4.9,
      "vendor": "les-fromages-de-gaetan",
      "part": "~150gr",
      "quantity": 1,
      "category": "Produits laitiers",
      "fulfillment": {
        "shipping": "grouped",
        "status": "fulfilled"
      }
    }
  ],
  "shipping": {
    "name": "cluzel evalet delphine",
    "note": "code d'entrée : 1956",
    "streetAdress": "route de chêne 34",
    "floor": "2",
    "postalCode": "1208",
    "region": "Genève",
    "when": "2016-02-26T15:00:00.000Z",
    "shipped": false,
    "geo": {
      "lat": 46.1997473,
      "lng": 6.1692497
    }
  },
  "sum": 24.1,
  "vendors": [
    {
      "slug": "les-fromages-de-gaetan",
      "name": "les-fromages-de-gaetan",
      "fees":0.15,
      "address": "todo"
    },
    {
      "slug": "purogusto",
      "fees":0.18,
      "name": "purogusto",
      "address": "todo"
    }
  ],
  "customer": {
    "id": 999
  }
}
];

//
// ------------------------ PRODUCTS --------------------------
//

exports.Products=[{
    _id : new ObjectId(), 
     sku:1000001,
     title: "Product 2 with cat",     
     details:{
        description:"description",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:false, 
     },  
     
     attributes:{
        available:true,
        comment:false, 
        discount:true
     },

     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'100gr'        
     },
     /* weight:0,1 */
     categories: c.Categories[1]._id,
     //un-autre-shop, id:0004, status:true, owner:gluck
     vendor:'515ec12e56a8d5961e000006'     
  },{
    _id : new ObjectId(), 
     sku:1000002,
     title: "Product 2 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:true,
        bio:true, 
     },  
     attributes:{
        available:true,
        comment:false, 
        discount:false
     },
     variants:[
        {title:'Variation A'}
     ],     
     pricing: {
        stock:10, 
        price:3.80,
        part:'0.75L'
     },
     /* weight:2 */
     categories: c.Categories[3]._id,
     //shop available==true, status!=true
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000003,
     title: "Product 3 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:true, 
     },  
     attributes:{
        available:true,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000004,
     title: "Product 4 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:true, 
     },  
     attributes:{
        available:true,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     vendor:'515ec12e56a8d5961e000005'
  },{
    _id : new ObjectId(), 
     sku:1000005,
     title: "Product not in stock",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:true, 
     },  
     attributes:{
        available:true,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:5, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     vendor:'515ec12e56a8d5961e000004'
  }  
];



