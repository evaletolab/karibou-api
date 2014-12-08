

module.exports = {
  shop:{
    system:{
      password:{len:6},
      post:{limitMS:500}
    },

    category:{
      types:['Category', 'Catalog']
    },

    //
    // collect place
    marketplace:{
      shipping:10, // shipping price
      list:[
        {name:"Marché de Plainpalais le mardi",lat:46.19838,lng:6.14083, d:2},
        {name:"Marché de Plainpalais le vendredi",lat:46.19838,lng:6.14083, d:5},
        {name:"Marché de Plainpalais le dimanche",lat:46.19838,lng:6.14083, d:0},
        {name:"Marché de Rive le jeudi" ,lat:46.20195,lng:6.15491, d:4},
        {name:"Marché de Rive le samedi" ,lat:46.20195,lng:6.15491, d:6},
        {name:"Halle de Rive" ,lat:46.202077,lng:6.15477, d:7}
      ]
    },
    user:{
      location:{
        list:["1201","1202","1203","1204","1205","1206","1207","1208","1227"]
      },
      region:{
        list:["Genève", "Carouge"]
      }
    },
    region:{
      selection:["Genève","Reignier, France"],
      list:["Aire-la-Ville,GE","Anières,GE","Avully,GE","Avusy,GE","Bardonnex,GE","Bellevue,GE",
            "Bernex,GE","Carouge,GE","Cartigny,GE","Céligny,GE","Chancy,GE","Chêne-Bougeries,GE",
            "Chêne-Bourg,GE","Choulex,GE","Collex-Bossy,GE","Collonge-Bellerive,GE",
            "Cologny,GE","Confignon,GE","Corsier,GE","Dardagny,GE","Genève",
            "Genthod,GE","Grand-Saconnex,GE","Gy,GE","Hermance,GE","Jussy,GE","Laconnex,GE",
            "Lancy,GE","Meinier,GE","Meyrin,GE","Onex,GE","Perly-Certoux,GE",
            "Plan-les-Ouates,GE","Pregny-Chambésy,GE","Presinge,GE","Puplinge,GE",
            "Russin,GE","Satigny,GE","Soral,GE","Thônex,GE","Troinex,GE","Vandoeuvres,GE",
            "Vernier,GE","Versoix,GE","Veyrier,GE", 
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
                       "paid",
                       "partially_refunded",
                       "refunded",
                       "voided"
      ],
      cancelreason:["customer", "fraud", "inventory", "system","timeout","other"],
      status:["failure","created","reserved","partial","fulfilled"],
      gateway:[ 
        {label:"postfinance",fees:0.02}, 
        {label:"american express",fees:0.029}, 
        {label:"visa",fees:0.029}, 
        {label:"mastercard",fees:0.029}, 
        {label:"invoice",fees:0.0}, 
        {label:"paypal",fees:0.034}, 
        {label:"bitcoin",fees:0.0}
      ],

      /* order is in timeout if payment status != 'paid' and created<15m (timeoutAndNotPaid)*/
      timeoutAndNotPaid:60,

      /* for testing 50 hours is the time limit between order and delivery*/
      /* timelimit = monday 18:00 + timelimit = dayDest 9:00*/

      // -> une commande le lundi à 9:00 .... mercredi 10:00 == 49h
      // -> une commande le lundi à 18:00 .... mercredi 10:00 == 40h
      // -> une commande le lundi à 20:00 .... mercredi 10:00 == 38h* minimum pour deux matinées
      timelimit:37,

      /* order date range between day1 to day2 max 11:00. Lapse time = timelimit */
      timelimitH:10,

      /* currently only grouped is available */
      shippingmode:["grouped", "none"],

      //
      // Dimanche(0), Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
      weekdays:[2,5],  
      shippingtimes:{16:"16:00 à 18:00"}
    }

  }
};
