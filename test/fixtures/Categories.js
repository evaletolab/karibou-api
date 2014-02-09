var ObjectId = require('mongodb').ObjectID;

exports.Categories=[{
    _id:new ObjectId('115ec12e56a8d5961e000000'),
    name:"alimentaire",
    slug:"alimentaire",
    weight:1,
    type:"Catalog"
  },{
    _id:new ObjectId('115ec12e56a8d5961e000001'),
    name:"Fruits",
    slug:"fruits",
    weight:2,
    type:"Category"
  },{
    _id:new ObjectId('115ec12e56a8d5961e000002'),
    name:"Légumes",
    slug:"legumes",
    weight:1,
    type:"Category"
  },{
    _id:new ObjectId('115ec12e56a8d5961e000003'),
    name:"Poissons",
    slug:"poissons",
    weight:0,
    type:"Category"
  }
];



