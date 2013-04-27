var ObjectId = require('mongodb').BSONNative.ObjectID;
var Categories=require('./Categories');

exports.Products=[{
    _id : new ObjectId(), 
     sku:12345,
     title: "Test product bio 1",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:true, 
     },  
     
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },

     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     },
     categories: [],
     vendor:'515ec12e56a8d5961e000004'     
  },{
    _id : new ObjectId(), 
     sku:12346,
     title: "Test product 2",
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:false, 
     },  
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     },
     categories: [],
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:12347,
     title: "Test product bio 3",
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:true, 
     },  
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     },
     categories: [],
     vendor:'515ec12e56a8d5961e000005'
  }
];



