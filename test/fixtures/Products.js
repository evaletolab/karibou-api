var ObjectId = require('mongodb').BSONNative.ObjectID;
var Categories=require('./Categories');

// shop[0](un-autre-shop, id:0004, status:true, owner:gluck)
// shop[1](mon-shop, id:0005, status:false, owner:gmail)
// shop[2](invalid-shop, id:0006, status:Date.now, owner:gluck)
exports.Products=[{
    _id : new ObjectId(), 
     sku:12345,
     title: "Test product bio 1",     
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
        part:'100gr'
     },
     categories: [],
     //un-autre-shop, status:true, owner:gluck     
     vendor:'515ec12e56a8d5961e000004'  
  },{
    _id : new ObjectId(), 
     sku:12346,
     title: "Test product 2",
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:false, 
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
        part:'100gr'
     },
     categories: [],
     //un-autre-shop, status:true, owner:gluck     
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:12347,
     title: "Test product bio 3",
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
        part:'100gr'
     },
     categories: [],
     //mon-shop, id:0005, status:false, owner:gmail
     vendor:'515ec12e56a8d5961e000005'
  }
];



