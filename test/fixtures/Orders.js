var ObjectId = require('mongodb').ObjectID;
var Categories=require('./Categories');
var data=require('./Users');

// shop[0](id:0004, status:true, owner:gluck)
// shop[1](id:0005, status:false, owner:gmail)
// shop[2](id:0006, status:Date.now, owner:gluck)

exports.Orders=[{
  {
      _id:ObjectId('515ec12e56a8d5961e000004'),
      "__v": 0,
      "oid": 100006,
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
          "_id": "52d8ea8d66f8a209778c0fd2"
      },
      "email": "evaleto@gmail.com",
      "payment": {
          "gateway": "postfinance"
      },
      "shipping": {
          "name": "famille olivier evalet",
          "note": "123456",
          "streetAdress": "route de chêne 34",
          "floor": "2",
          "postalCode": "1208",
          "region": "GE",
          "when": "2014-01-20T08:32:13.873Z",
          "geo": {
              "lat": 46.1997473,
              "lng": 6.1692497
          }
      },
      "items": [
          {
              "sku": 1000001,
              "title": "Product 1 with cat",
              "quantity": 1,
              "price": 3,
              "part": "100gr",
              "note": "",
              "finalprice": 3,
              "category": "Fruits",
              "_id": "52d8ea8e66f8a209778c0fe2",
              "vendor": {
                  "ref": "515ec12e56a8d5961e000004",
                  "slug": "un-autre-shop",
                  "name": "Un autre shop",
                  "fullName": "515ec12e56a8d5961e000444",
                  "address": "TODO"
              },
              "fulfillment": {
                  "shipping": "grouped",
                  "status": "created"
              }
          },
          {
              "sku": 1000002,
              "title": "Product 2 with cat",
              "quantity": 2,
              "price": 7.6,
              "part": "0.75L",
              "note": "",
              "finalprice": 7.6,
              "category": "Poissons",
              "_id": "52d8ea8e66f8a209778c0fe1",
              "vendor": {
                  "ref": "515ec12e56a8d5961e000004",
                  "slug": "un-autre-shop",
                  "name": "Un autre shop",
                  "fullName": "515ec12e56a8d5961e000444",
                  "address": "TODO"
              },
              "fulfillment": {
                  "shipping": "grouped",
                  "status": "created"
              }
          }
      ],
      "fulfillments": {
          "status": "created"
      },
      "closed": "2014-01-17T08:32:14.084Z",
      "created": "2014-01-17T08:32:14.084Z"
  }
];




