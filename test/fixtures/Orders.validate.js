var ObjectId = require('mongodb').ObjectID;
var c=require('./Categories');
var u=require('./Users');
var Orders=require('mongoose').model('Orders');
var weekdays=config.shared.order.weekdays;

//
// use the same dates in the test and this fixture

config.shared.order.weekdays=[0,1,2,3,4,5,6];
var okDay=Orders.findNextShippingDay();
var when1=Orders.jumpToNextWeekDay(okDay,config.shared.order.weekdays[2]);
var when2=new Date(when1.getTime()+86400000*3);
config.shared.order.weekdays=weekdays;

// console.log('---------------ok',okDay);
// console.log('---------------when1',when1);
// console.log('---------------when2',when2);

exports.Orders=[
    {
        "_id": ObjectId("52f12f09a328f285313bda00"),
        "oid": 2000006,
        /* customer */
        "customer": {
            "password": "password",
            "tags": [],
            "shops": [],
            "roles": [],
            "provider": "local",
            "photo": "jpg",
            "phoneNumbers": [
                {
                    "what": "principal",
                    "number": "076 3787968"
                }
            ],
            "addresses": [
                {
                    "region": "Genève",
                    "primary": true,
                    "geo": {
                        "lng": 6.1692497,
                        "lat": 46.1997473
                    },
                    "postalCode": "1208",
                    "floor": "2",
                    "streetAdress": "route de chêne 34",
                    "note": "123456",
                    "name": "famille olivier evalet"
                }
            ],
            "email": {
                "status": true,
                "address": "evaleto@gmail.com"
            },
            "displayName": "olvier pluck",
            "likes": [],
            "invoices": [],
            "id": 12346,
            "created": "2013-03-27T17:07:34.201Z",
            "status": true,
        },

        /* email customer */
        "email": "evaleto@gmail.com",

        payment: {
            issuer: "tester",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"paid"
        },

        /* shipping */
        "shipping": {
            "name": "famille olivier evalet",
            "note": "123456",
            "streetAdress": "route de chêne 34",
            "floor": "2",
            "postalCode": "1208",
            "region": "Genève",
            "when": "2014-02-07T18:18:49.100Z",
            "geo": {
                "lat": 46.1997473,
                "lng": 6.1692497
            }
        },

        /* vendors */
        vendors: [
            {
                /* shop status=available=true */
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "premier-shop",
                name: "Premier shop",
                address: "TODO",
            },
            {
                /*shop status !=true */
                ref: ObjectId('515ec12e56a8d5961e000005'),
                slug: "mon-shop",
                name: "mon shop",
                address: "TODO",
            },
            {
                /* shop available !=true */
                ref: ObjectId('515ec12e56a8d5961e000007'),
                slug: "shop-not-available",
                name: "shop not available",
                address: "TODO",
            }
        ],
        /* items */
        items: [
            {
                sku: 1000001,
                title: "Product 1 with cat",
                quantity: 1,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 2.5,
                category: "Viande",
                vendor:"mon-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "created"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 3,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 3,
                category: "Fruits",
                vendor:"premier-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "created"
                }
            },
            {
                sku: 1000003,
                title: "Product 3 with cat",
                quantity: 2,
                price: 7.6,
                part: "0.75L",
                note: "",
                finalprice: 7.6,
                category: "Poissons",
                vendor:"premier-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "created"
                }
            }
        ],

        fulfillments: {
            status: "created"
        },

        created: new Date()
    }
];

//
// ------------------------ ORDERS --------------------------
//

exports.Shops=[{
    _id:ObjectId('515ec12e56a8d5961e000004'),
    status:true,
    name: "Premier shop",
    description:"cool ce shop",
    urlpath:"premier-shop",
    catalog:c.Categories[0]._id,
    owner:u.Users[0]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:false,
      weekdays:[0,1,2,3,4,5,6]
    }
  },{
    _id:ObjectId('515ec12e56a8d5961e000005'),
    status:true,
    name: "mon shop",
    description:"cool ce shop",
    urlpath:"mon-shop",
    catalog:c.Categories[0]._id,
    owner:u.Users[1]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:false,
      weekdays:[0,1,2,3,4,5,6]
    }
  },{
    _id:ObjectId('515ec12e56a8d5961e000006'),
    status:Date.now,
    name: "invalid shop",
    description:"invalid shop",
    urlpath:"invalid-shop",
    catalog:c.Categories[0]._id,
    owner:u.Users[0]._id,    
    available:{
      active:true,
      from:okDay,
      to:when1,
      weekdays:[0,1,2,3,4,5,6]
    },


    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    }
  },{
    _id:ObjectId('515ec12e56a8d5961e000017'),
    status:true,
    name: "not available",
    description:"cool ce shop",
    urlpath:"not-available",
    catalog:c.Categories[0]._id,
    owner:u.Users[1]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:true,
      from:okDay,
      to:when1,
      weekdays:[0,1,2,3,4,5,6]
    }
  }
];

//
// ------------------------ PRODUCTS --------------------------
//

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
     categories: c.Categories[1]._id,
     //status:true, active:true
     vendor:'515ec12e56a8d5961e000004'     
  },{
    _id : new ObjectId(), 
     sku:1000002,
     title: "Product with shop disabled by kariboo",     
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
     categories: c.Categories[3]._id,
     //shop available==true, status!=true
     vendor:'515ec12e56a8d5961e000006'
  },{
    _id : new ObjectId(), 
     sku:1000003,
     title: "Product with shop disabled",     
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
        stock:15, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     //shop available !=true, status=true
     vendor:'515ec12e56a8d5961e000017'
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
     categories: c.Categories[2]._id,
     // status:true, available==true
     vendor:'515ec12e56a8d5961e000004'
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
        available:false,
        comment:false, 
        discount:false
     },
     pricing: {
        stock:15, 
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     //status:true, active:true
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000006,
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
        stock:0,        /*NO STOCK */
        price:3.80,
        discount:3.0,
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     //status:true, active:true
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000007,
     title: "Product available",     
     details:{
        description:"la patrie de la pasta. ",
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
     //status:true, active:true
     vendor:'515ec12e56a8d5961e000004'
  }   
];



