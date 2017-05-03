

module.exports = {
  i18n:{
    locales:['en','fr'],
    defaultLocale:'fr'
  },

  shopsLimit:1,
  generalFees:0.20,
  system:{
    password:{len:6},
    post:{limitMS:500}
  },

  document:{
    types:['recipe','post','bundle','selection','page']
  },


  category:{
    types:['Category', 'Catalog']
  },

  shipping:{
    average:115, // average 
    discountA:145,    // half price 5.4@18% & 4.5@15%
    discountB:180,    // 180 full price 11.7@18% & 9.75@15%
    price:{
      hypercenter:11.9,
      periphery:14.90
    }, // shipping price
    priceA:0,
    priceB:0,
    periphery:["1212","1213","1218","1219","1223","1224","1225","1226","1228","1231","1232","1233","1234","1253","1255","1256","1257","1258"]
  },

  issue:{
    //
    // limit of time to create an issue after order is closed
    ttl:365,
    code:[
    "issue_no_issue",
    "issue_missing_client_id",
    "issue_missing_product",
    "issue_wrong_packing",
    "issue_wrong_product",
    "issue_wrong_client_id",
    "issue_wrong_product_quality"
    ]
  },
  //
  // collect place
  marketplace:{
    list:[
      {name:"Marché de Plainpalais le mardi",lat:46.19838,lng:6.14083, d:2},
      {name:"Marché de Plainpalais le vendredi",lat:46.19838,lng:6.14083, d:5},
      {name:"Marché de Plainpalais le dimanche",lat:46.19838,lng:6.14083, d:0},
      {name:"Marché de Rive le jeudi" ,lat:46.20195,lng:6.15491, d:4},
      {name:"Marché de Rive le samedi" ,lat:46.20195,lng:6.15491, d:6},
      {name:"Halle de Rive" ,lat:46.202077,lng:6.15477}
    ]
  },
  user:{
    location:{
      list:[
        "1201","1202","1203","1204","1205","1206","1207","1208","1209","1227",
        "1212","1213","1218","1219","1223","1224","1225","1226","1228","1231","1232","1233","1234","1253","1255","1256","1257","1258"]
    },
    region:{
      list:["Genève", "Carouge,GE"]
    }
  },
  region:{
    list:["Aire-la-Ville,GE","Anières,GE","Avully,GE","Avusy,GE","Bardonnex,GE","Bellevue,GE",
          "Bernex,GE","Carouge,GE","Cartigny,GE","Céligny,GE","Chancy,GE","Chêne-Bougeries,GE",
          "Chêne-Bourg,GE","Choulex,GE","Collex-Bossy,GE","Collonge-Bellerive,GE",
          "Cologny,GE","Confignon,GE","Corsier,GE","Dardagny,GE","Genève",
          "Genthod,GE","Grand-Saconnex,GE","Gy,GE","Hermance,GE","Jussy,GE","Laconnex,GE",
          "Lancy,GE","Meinier,GE","Meyrin,GE","Onex,GE","Perly-Certoux,GE",
          "Plan-les-Ouates,GE","Pregny-Chambésy,GE","Presinge,GE","Puplinge,GE",
          "Russin,GE","Satigny,GE","Soral,GE","Thônex,GE","Troinex,GE","Vandoeuvres,GE",
          "Vernier,GE","Versoix,GE","Veyrier,GE", 
      	  "Tannay,VD",
          "Reignier, France"
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
                     "invoice",
                     "paid",
                     "partially_refunded",
                     "refunded",
                     "voided"
    ],
    cancelreason:["customer", "fraud", "inventory", "system","timeout","other"],
    status:["failure","created","reserved","partial","fulfilled"],
    gateway:[ 
      {label:"postfinance card",fees:0.0}, 
      {label:"american express",fees:0.01}, 
      {label:"visa",fees:0.00}, 
      {label:"mastercard",fees:0.0}, 
      {label:"wallet", fees:0.000}, 
      {label:"invoice",fees:0.000}, 
      {label:"paypal", fees:0.034}, 
      {label:"bitcoin",fees:0.0}
    ],

    /*open invoice limit to authorize invoice payment */
    openInvoice:0,

    /* order is in timeout if payment status != 'paid' and created<15m (timeoutAndNotPaid)*/
    timeoutAndNotPaid:60,

    /* for testing 50 hours is the time limit between order and delivery*/
    /* timelimit = monday 18:00 + timelimit = dayDest 9:00*/

    // -> une commande le dimanche à 9:00 .... mardi 10:00 == 49h
    // -> une commande le dimanche à 18:00 .... mardi 10:00 == 40h
    // -> une commande le dimanche à 23:00 .... mardi 10:00 == 35h* minimum pour deux matinées
    // -> une commande le lundi à 14:00 .... mardi 10:00 == 20h* minimum 
    timelimit:20,

    //
    // stripe uncaptured charges expire in 7 days
    // https://support.stripe.com/questions/does-stripe-support-authorize-and-capture 
    uncapturedTimeLimit:6,

    /* order date range between day1 to day2 max 11:00. Lapse time = timelimit */
    timelimitH:10,

    /* currently only grouped is available */
    shippingmode:["grouped", "none"],

    //
    // Dimanche(0), Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
    weekdays:[2,5],  
    shippingtimes:{
      16:"16:00 à 18:00"
    }
  }
};
