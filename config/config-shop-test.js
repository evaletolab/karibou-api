

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

      /* for testing 50 hours is the time limit before taking order*/
      timelimit:50,
      shippingmode:["grouped", "none"],
      //
      // Dimanche, Lundi, Mardi, Mercredi(1), Jeudi, Vendredi, Samedi(1)
      weekdays:[1,2,3,4,5,6],      
      shippingdays:{
        'Dimanche':  {active:false},
        'Lundi':     {active:true},
        'Mardi':     {active:true},
        'Mercredi':  {active:true},
        'Jeudi':     {active:true},
        'Vendredi':  {active:true},
        'Samedi':    {active:true},
      }      
    }

  }
};
