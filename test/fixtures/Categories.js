var ObjectId = require('mongodb').BSONNative.ObjectID;

exports.Categories=[{
    _id:new ObjectId(),
    name:"alimentaire",
    slug:"alimentaire",
    weight:1,
    type:"Catalog"
  },{
    _id:new ObjectId(),
    name:"Fruits",
    slug:"fruits",
    weight:2,
    type:"Category"
  },{
    _id:new ObjectId(),
    name:"Légumes",
    slug:"legumes",
    weight:1,
    type:"Category"
  },{
    _id:new ObjectId(),
    name:"Poissons",
    slug:"poissons",
    weight:0,
    type:"Category"
  }
];



