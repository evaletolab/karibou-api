

module.exports = {
  shop:{
    system:{
      password:{len:5},
      post:{limitMS:10}
    },
    category:{
      types:['Category', 'Catalog']
    },
    marketplace:{
      list:[
        {name:"Marché de Plainpalais le mardi",lat:46.19838,lng:6.14083, d:2},
        {name:"Marché de Plainpalais le vendredi",lat:46.19838,lng:6.14083, d:5},
        {name:"Marché de Plainpalais le dimanche",lat:46.19838,lng:6.14083, d:0},
        {name:"Marché de Rive le jeudi" ,lat:46.20195,lng:6.15491, d:4},
        {name:"Marché de Rive le samedi" ,lat:46.20195,lng:6.15491, d:6}
      ]
    },
    user:{
      location:{
        list:["1201","1202","1203","1204","1205","1206","1207","1208"]
      },
      region:{
        list:["Genève", "Carouge"]
      }
    },
    region:{
      list:["Genève","Reignier, France"],
      all:["Aire-la-Ville","Anières","Avully","Avusy","Bardonnex","Bellevue",
            "Bernex","Carouge","Cartigny","Céligny","Chancy","Chêne-Bougeries",
            "Chêne-Bourg","Choulex","Collex-Bossy","Collonge-Bellerive",
            "Cologny","Confignon","Corsier","Dardagny","Genève",
            "Genthod","Grand-Saconnex","Gy","Hermance","Jussy","Laconnex",
            "Lancy","Meinier","Meyrin","Onex","Perly-Certoux",
            "Plan-les-Ouates","Pregny-Chambésy","Presinge","Puplinge",
            "Russin","Satigny","Soral","Thônex","Troinex","Vandoeuvres",
            "Vernier","Versoix","Veyrier", "Reignier, France"
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
      status:["failure","created","partial","fulfilled"],
      gateway:[ {label:"postfinance",fees:0.015}, {label:"paypal",fees:0.0017}, {label:"bitcoin",fees:0.0}],

      /* for testing 50 hours is the time limit between order and delivery*/
      /* timelimit = monday 18:00 + timelimit = dayDest 9:00*/
      timelimit:39,

      /* order date range between day1 to day2 max 9:00. Lapse time = timelimit */
      timelimitH:2,

      /* currently only grouped is available */
      shippingmode:["grouped", "none"],

      /* order is in timeout if payment status != 'paid' and created<1s (timeoutAndNotPaid)*/
      timeoutAndNotPaid:0.2,

      //
      // Dimanche*, Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi(
      weekdays:[1,2,3,4,5,6],      
      shippingtimes:{11:"11:00 à 13:00", 16:"16:00 à 18:00"},    
      
    }

  }
};
