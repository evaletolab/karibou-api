

module.exports = {
  shop:{
    category:{
      types:['Category', 'Catalog']
    },

    //
    // real market place
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
      status:["created","partial","fulfilled", "failure"],
      gateway:[ {label:"postfinance",fees:0.03}, {label:"paypal",fees:0.034}, {label:"bitcoin",fees:0.0}],

      /* order is in timaout if payment status != 'paid' and created<15m (timeoutAndNotPaid)*/
      timeoutAndNotPaid:900,

      /* in production 36 hours is the time limit between order and delivry*/
      timelimit:36,

      /* currently only grouped is available */
      shippingmode:["grouped", "none"],

      //
      // Dimanche, Lundi, Mardi, Mercredi(1), Jeudi, Vendredi, Samedi(1)
      weekdays:[3,6],      
      shippingdays:{
        'Dimanche':  {active:false},
        'Lundi':     {active:false},
        'Mardi':     {active:false},
        'Mercredi':  {active:true},
        'Jeudi':     {active:false},
        'Vendredi':  {active:false},
        'Samedi':    {active:true},
      }
    }

  }
};
