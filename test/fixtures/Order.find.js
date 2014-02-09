var ObjectId = require('mongodb').ObjectID;
var Categories=require('./Categories');
var data=require('./Users');

// shop[0](id:0004, status:true, owner:gluck)
// shop[1](id:0005, status:false, owner:gmail)
// shop[2](id:0006, status:Date.now, owner:gluck)

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
                    "region": "GE",
                    "primary": true,
                    "geo": {
                        "lng": 6.1692497,
                        "lat": 46.1997473
                    },
                    "postalCode": "1208",
                    "location": "Genève-Ville",
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

        /* payment */
        "payment": {
            "gateway": "postfinance"
        },

        /* shipping */
        "shipping": {
            "name": "famille olivier evalet",
            "note": "123456",
            "streetAdress": "route de chêne 34",
            "floor": "2",
            "postalCode": "1208",
            "region": "GE",
            "when": "2014-02-07T18:18:49.100Z",
            "geo": {
                "lat": 46.1997473,
                "lng": 6.1692497
            }
        },

        /* vendors */
        vendors: [
            {
                ref: "515ec12e56a8d5961e000004",
                slug: "un-autre-shop",
                name: "Un autre shop",
                address: "TODO",
            },
            {
                ref: "515ec12e56a8d5961e000005",
                slug: "un-shop",
                name: "Un shop",
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
                vendor:"un-shop",
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
                vendor:"un-autre-shop",
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
                vendor:"un-autre-shop",
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



