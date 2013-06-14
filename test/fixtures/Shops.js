var ObjectId = require('mongodb').BSONNative.ObjectID;
var Categories=require('./Categories');
var data=require('./Users');

exports.Shops=[{
    _id:ObjectId('515ec12e56a8d5961e000004'),
    status:true,
    name: "Un autre shop",
    description:"cool ce shop",
    urlpath:"un-autre-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    }
  },{
    _id:ObjectId('515ec12e56a8d5961e000005'),
    name: "mon shop",
    description:"cool ce shop",
    urlpath:"mon-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[1]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    }
  },
  {
    _id:ObjectId('515ec12e56a8d5961e000006'),
    status:Date.now,
    name: "invalid shop",
    description:"invalid shop",
    urlpath:"invalid-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,    
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    }
  }
];



