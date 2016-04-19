var ObjectId = require('mongodb').ObjectID;
var data=require('./Categories.js');
var more=require('./Users');


//product 1 not available , shop available
//product 2 available , shop not available
//product 3 available , shop closed
//product 4 available , shop ok but will be closed
//product 5 available , shop was closed in past

var Orders=require('mongoose').model('Orders');
var closed=new Date().plusDays(2);
closed.setHours(0,0,0,0);
var when1=closed.plusDays(7);
var when2=when1.plusDays(10);
var when3=new Date(when1.getTime()-86400000*20);
var when4=new Date(when1.getTime()-86400000*19);


console.log('---------------closed',closed);
console.log('---------------when1',when1);
console.log('---------------when2',when2);

exports.Products=[{
    _id : new ObjectId(), 
     sku:1000001,
     title: "Product 1 with cat",     
     details:{
        description:"description",
        comment:"Temps de cuisson : 16 minutes",
        homemade:true, 
        natural:false,
        bio:false, 
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
        part:'100gr'        
     },
     /* weight:0,1 */
     categories: data.Categories[1]._id,
     //product 1 not available , shop available
     vendor:'515ec12e56a8d5961e000004'     
  },{
    _id : new ObjectId(), 
     sku:1000002,
     title: "Product 2 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        homemade:true, 
        natural:true,
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
     categories:data.Categories[3]._id,
    //product 2 available , shop not available
     vendor:'515ec12e56a8d5961e000005'
  },{
    _id : new ObjectId(), 
     sku:1000003,
     title: "Product 3 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        homemade:true, 
        natural:false,
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
     categories: data.Categories[1]._id,
    //product 3 available , shop closed
     vendor:'515ec12e56a8d5961e000006'
  },{
    _id : new ObjectId(), 
     sku:1000004,
     title: "Product 3 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        homemade:true, 
        natural:false,
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
        part:'0.75L'
     },
     categories: data.Categories[1]._id,
    //product 3 available , shop ok but will be closed
     vendor:'515ec12e56a8d5961e000007'
  },{
    _id : new ObjectId(), 
     sku:1000005,
     title: "Product 3 with cat",     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        homemade:true, 
        natural:false,
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
        part:'0.75L'
     },
     categories: data.Categories[1]._id,
    //product 3 available , shop ok  was  closed past
     vendor:'515ec12e56a8d5961e000008'
  }
];



exports.Shops=[{
    /*shop status ==true */  
    _id:ObjectId('515ec12e56a8d5961e000004'),
    status:true,
    name: "Un autre shop",
    description:"cool ce shop",
    urlpath:"un-autre-shop",
    catalog:data.Categories[0]._id,
    owner:more.Users[0]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    address:{
            region: "Genève",
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet",
            phone:"0123456"
        }    
  },{
    /*shop status !=true */
    _id:ObjectId('515ec12e56a8d5961e000005'),
    name: "mon shop",
    description:"cool ce shop",
    urlpath:"mon-shop",
    catalog:data.Categories[0]._id,
    owner:more.Users[1]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    address:{
            region: "Genève",
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet",
            phone:"0123456"
        }  
  },
  {
    /*shop status =true */
    _id:ObjectId('515ec12e56a8d5961e000006'),
    status:true,
    name: "invalid shop",
    description:"invalid shop",
    urlpath:"invalid-shop",
    catalog:data.Categories[0]._id,
    owner:more.Users[0]._id,    
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:true,
      from:closed,
      to:when2,
      weekdays:[0,1,2,3,4,5,6]
    },
    address:{
            region: "Genève",
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet",
            phone:"0123456"
        }  
  },
  {
    /* shop available =true */
    _id:ObjectId('515ec12e56a8d5961e000007'),
    status:true,
    name: "shop not available in futur",
    description:"invalid shop",
    urlpath:"shop-not-available-in-futur",
    catalog:data.Categories[0]._id,
    owner:more.Users[0]._id,    
    available:{
      active:true,
      from:when1,
      to:when2,
      weekdays:[0,1,2,3,4,5,6]
    },
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    address:{
            region: "Genève",
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet",
            phone:"0123456"
        }  
  },
  {
    /* shop available =true */
    _id:ObjectId('515ec12e56a8d5961e000008'),
    status:true,
    name: "shop not available in past",
    description:"invalid shop",
    urlpath:"shop-not-available-in-past",
    catalog:data.Categories[0]._id,
    owner:more.Users[0]._id,    
    available:{
      active:true,
      from:when3,
      to:when4,
      weekdays:[0,1,2,3,4,5,6]
    },
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    address:{
            region: "Genève",
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet",
            phone:"0123456"
        }  
  }
];

