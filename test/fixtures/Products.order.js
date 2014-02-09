var ObjectId = require('mongodb').ObjectID;
var data=require('./Categories.js');

// 2products ->shop[0](un-autre-shop, id:0004, status:true, owner:gluck)
// 1product  ->shop[1](mon-shop, id:0005, status:false, owner:gmail)
// 0product  ->shop[2](invalid-shop, id:0006, status:Date.now, owner:gluck)

exports.Products=[{
    _id : new ObjectId(), 
     sku:1000001,
     title: "Product 1 with cat",     
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
     categories: data.Categories[1]._id,
     //un-autre-shop, id:0004, status:true, owner:gluck
     vendor:'515ec12e56a8d5961e000004'     
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
     pricing: {
        stock:10, 
        price:3.80,
        part:'0.75L'
     },
     /* weight:2 */
     categories: data.Categories[3]._id,
     //un-autre-shop, id:0004, status:true, owner:gluck
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
        available:false,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: data.Categories[2]._id,
     //mon-shop, id:0005, status:false, owner:gmail
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000004,
     title: "Product disabled",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:true, 
     },  
     attributes:{
        available:false,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: data.Categories[2]._id,
     // status:false, owner:gmail
     vendor:'515ec12e56a8d5961e000006'
  },{
    _id : new ObjectId(), 
     sku:1000005,
     title: "Product disabled by kariboo",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        gluten:true, 
        ogm:false,
        bio:true, 
     },  
     attributes:{
        available:false,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: data.Categories[2]._id,
     // status:true available:false
     vendor:'515ec12e56a8d5961e000017'
  }  
];



