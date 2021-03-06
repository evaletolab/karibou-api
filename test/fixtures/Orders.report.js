var ObjectId = require('mongodb').ObjectID;
var c=require('./Categories');
var u=require('./Users');
var orders = require('mongoose').model('Orders');

// this fixture focus on order with 
//  - different dates (today, next shipping day, next week), 
//  - config.shared.financialstatus  ("pending","authorized","partially_paid","paid", "partially_refunded" ...)
//  - config.shared.cancelreason ("customer", "fraud", "inventory", "other")
//  - config.shared.status ("fulfilled","partial","fulfilled", "shipped","failure")
//
// build orders with
//  - 2 users
//  - all products, stock, shop, user ... are available
//  -

var oneweek=orders.findOneWeekOfShippingDay();
var firstDayOfMonth=orders.findCurrentShippingDay();
var lastDayOfMonth=new Date(firstDayOfMonth);
var customerDay=oneweek[0];

var passedday=new Date(customerDay.getTime()-86400000*7)

lastDayOfMonth.setDate(lastDayOfMonth.daysInMonth());
lastDayOfMonth.setHours(22,0,0,0);

firstDayOfMonth.setDate(1);
firstDayOfMonth.setHours(16,0,0,0);

exports.Orders=[
    {
        _id: ObjectId("52f12f09a328f285313bda10"),
        oid: 2100000,
        /* customer */
        customer: u.Users[1],

        /* email customer */
        email: "evaleto@gmail.com",

        /* payment */
        payment: {
            issuer: "visa",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"voided"
        },

        /* shipping adresse*/
        shipping: { 
            name: "famille olivier evalet 1", 
            note: "123456", 
            streetAdress: "route de chêne 34", 
            floor: "2", 
            postalCode: "1208", 
            region: "Genève", 
            when: lastDayOfMonth, 
            geo: { lat: 46.1997473, lng: 6.1692497}
        },

        items: [
            {
                sku: 1000001,
                title: "Product 1 with cat",
                quantity: 3,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 10,
                category: "Viande",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 3,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 10,
                category: "Fruits",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            }
        ],


        /* vendors */
        vendors: [
            {
                /* shop available !=true */
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "un-autre-shop",
                name: "un autre shop",
                address: "TODO",
                fees:.14
            }
        ],

        fulfillments: {
            status: "failure"
        },

        created: new Date(),
        closed:passedday      
    },
    {
        _id: ObjectId("52f12f09a328f285313bda00"),
        oid: 2000006,
        /* customer */
        customer: u.Users[1],

        /* email customer */
        email: "evaleto@gmail.com",

        /* payment */
        payment: {
            issuer: "tester",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"paid"
        },

        fulfillments: {
            status: "fulfilled"
        },

        /* shipping adresse*/
        shipping: { name: "famille olivier evalet 1", note: "123456", streetAdress: "route de chêne 34", floor: "2", postalCode: "1208", region: "Genève", when: firstDayOfMonth, geo: { lat: 46.1997473, lng: 6.1692497}},

        /* vendors */
        vendors: [
            {
                /*shop status !=true */
                ref: ObjectId('515ec12e56a8d5961e000006'),
                slug: "super-shop",
                name: "super shop",
                address: "TODO",
                fees:.16
            },
            {
                /* shop available !=true */
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "un-autre-shop",
                name: "un autre shop",
                address: "TODO",
                fees:.14
            }
        ],
        /* items */
        items: [
            {
                sku: 1000001,
                title: "Product 1 with cat",
                quantity: 3,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 10,
                category: "Viande",
                vendor:"super-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 3,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 10,
                category: "Fruits",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 1,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 1,
                category: "Fruits",
                vendor:"un-autre-shop",
                variant:{
                    title:'Variation A'
                },
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            }
        ],


        closed:passedday,      
        created: new Date()
    },{

        _id: ObjectId("52f12f09a328f285313bda01"),
        oid: 2000007,
        /* customer */
        customer: u.Users[2],

        /* email customer */
        email: "delphine@gmail.com",

        /* payment */
        payment: {
            issuer: "mastercard",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"paid"
        },

        fulfillments: {
            status: "fulfilled"
        },

        /* shipping adresse*/
        shipping: { 
            name: "famille olivier evalet 1", 
            note: "123456", 
            streetAdress: "route de chêne 34", floor: "2", postalCode: "1208", region: "Genève", 
            when: firstDayOfMonth, geo: { lat: 46.1997473, lng: 6.1692497}
        },

        /* vendors */
        vendors: [
            {
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "un-autre-shop",
                name: "Un autre shop",
                address: "TODO",
                fees:.14
            },
            {
                /*shop status !=true */
                ref: ObjectId('515ec12e56a8d5961e000005'),
                slug: "mon-shop",
                name: "mon shop",
                address: "TODO",
                fees:.15
            }
        ],
        /* items */
        items: [
            {
                sku: 1000004,
                title: "Product 4 with cat",
                quantity: 1,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 10,
                category: "Viande",
                vendor:"mon-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "failure"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 3,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 10,
                category: "Fruits",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000003,
                title: "Product 3 with cat",
                quantity: 2,
                price: 7.6,
                part: "0.75L",
                note: "",
                finalprice: 15,
                category: "Poissons",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "failure"
                }
            }
        ],


        created: new Date(),
        closed:passedday      

    },{

        _id: ObjectId("52f12f09a328f285313bda02"),
        oid: 2000008,
        /* customer */
        customer: u.Users[1],

        /* email customer */
        email: "evaleto@gmail.com",

        /* payment */
        payment: {
            issuer: "tester",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"paid"
        },

        fulfillments: {
            status: "fulfilled"
        },

        /* shipping adresse*/
        shipping: { 
            name: "famille olivier evalet 1", 
            note: "123456", 
            streetAdress: "route de chêne 34", floor: "2", postalCode: "1208", region: "Genève", 
            when: lastDayOfMonth, geo: { lat: 46.1997473, lng: 6.1692497}
        },

        /* vendors */
        vendors: [
            {
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "un-autre-shop",
                name: "Un autre shop",
                address: "TODO",
                fees:.14
            },
            {
                /*shop status !=true */
                ref: ObjectId('515ec12e56a8d5961e000005'),
                slug: "mon-shop",
                name: "mon shop",
                address: "TODO",
                fees:.30
            }
        ],
        /* items */
        items: [
            {
                sku: 1000004,
                title: "Product 4 with cat",
                quantity: 1,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 2.5,
                category: "Viande",
                vendor:"mon-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000002,
                title: "Product 2 with cat",
                quantity: 3,
                price: 3,
                part: "100gr",
                note: "",
                finalprice: 9,
                category: "Fruits",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            },
            {
                sku: 1000003,
                title: "Product 3 with cat",
                quantity: 2,
                price: 7.6,
                part: "0.75L",
                note: "",
                finalprice: 15,
                category: "Poissons",
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            }
        ],


        created: lastDayOfMonth,
        closed:passedday      

    },{

        _id: ObjectId("52f12f09a328f285313bda03"),
        oid: 2000009,
        /* customer */
        customer: u.Users[1],

        /* email customer */
        email: "evaleto@gmail.com",

        /* payment */
        payment: {
            issuer: "tester",
            number:'98xxxxxxx4123',
            alias:'01234567890',
            status:"paid"
        },

        fulfillments: {
            status: "fulfilled"
        },

        /* shipping adresse*/
        shipping: {
            region: "Genève",
            when: lastDayOfMonth,
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            location: "Genève-Ville",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet 4"
        },

        /* vendors */
        vendors: [
            {
                ref: ObjectId('515ec12e56a8d5961e000004'),
                slug: "un-autre-shop",
                name: "Un autre shop",
                address: "TODO",
                fees:.14
            },
            {
                /*shop status !=true */
                ref: ObjectId('515ec12e56a8d5961e000005'),
                slug: "mon-shop",
                name: "mon shop",
                address: "TODO",
                fees:.15
            }
        ],
        /* items */
        items: [
            {
                sku: 1000004,
                title: "Product 4 with cat",
                quantity: 1,
                price: 2.5,
                part: "1pce",
                note: "",
                finalprice: 2.5,
                category: "Viande",
                vendor:"mon-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
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
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
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
                vendor:"un-autre-shop",
                fulfillment: {
                    shipping: "grouped",
                    status: "fulfilled"
                }
            }
        ],


        created: new Date(),
        closed:passedday      

    }
];

//
// ------------------------ SHOPS --------------------------
//

exports.Shops=[{
    _id:ObjectId('515ec12e56a8d5961e000004'),
    status:true,
    name: "Un autre shop",
    description:"cool ce shop",
    urlpath:"un-autre-shop",
    catalog:c.Categories[0]._id,
    owner:u.Users[0]._id,
    available:{
      active:false,
      weekdays:[0,1,2,3,4,5,6]
    },
    account:{
        fees:.2
    },
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
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
    status:true,
    name: "super shop",
    description:"super shop",
    urlpath:"super-shop",
    catalog:c.Categories[0]._id,
    owner:u.Users[0]._id,    
    available:{
      active:false,
      weekdays:[0,1,2,3,4,5,6]
    },
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    }
  },{
    _id:ObjectId('515ec12e56a8d5961e000017'),
    status:true,
    name: "un shop",
    description:"cool ce shop",
    urlpath:"un-shop",
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
  }
];

//
// ------------------------ PRODUCTS --------------------------
//

exports.Products=[{
    _id : new ObjectId(), 
     sku:1000001,
     title: "Product 2 with cat",     
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
     //un-autre-shop, id:0004, status:true, owner:gluck
     vendor:'515ec12e56a8d5961e000006'     
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
     variants:[
        {title:'Variation A'}
     ],     
     pricing: {
        stock:10, 
        price:3.80,
        part:'0.75L'
     },
     /* weight:2 */
     categories: c.Categories[3]._id,
     //shop available==true, status!=true
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
     categories: c.Categories[2]._id,
     vendor:'515ec12e56a8d5961e000004'
  },{
    _id : new ObjectId(), 
     sku:1000004,
     title: "Product 4 with cat",     
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
        part:'0.75L'
     },
     categories: c.Categories[2]._id,
     vendor:'515ec12e56a8d5961e000005'
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
     vendor:'515ec12e56a8d5961e000004'
  }  
];



