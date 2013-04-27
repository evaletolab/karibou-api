var ObjectId = require('mongodb').BSONNative.ObjectID;

exports.Categories=[{
    _id:new ObjectId(),
    name:"alimentaire",
    slug:"alimentaire",
    type:"Catalog"
  },{
    _id:new ObjectId(),
    name:"Fruits",
    slug:"fruits",
    type:"Category"
  },{
    _id:new ObjectId(),
    name:"Légumes",
    slug:"legumes",
    type:"Category"
  },{
    _id:new ObjectId(),
    name:"Poissons",
    slug:"poissons",
    type:"Category"
  }
];



