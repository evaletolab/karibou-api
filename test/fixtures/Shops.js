var ObjectId = require('mongodb').ObjectID;
var Categories=require('./Categories');
var data=require('./Users');

// shop[0](id:0004, status:true, owner:gluck)
// shop[1](id:0005, status:false, owner:gmail)
// shop[2](id:0006, status:Date.now, owner:gluck)

exports.Shops=[{
    /*shop status ==true */  
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
    catalog:Categories.Categories[0]._id,
    owner:data.Users[1]._id,
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
    /*shop status !=true */
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
    /* shop available !=true */
    _id:ObjectId('515ec12e56a8d5961e000007'),
    status:true,
    name: "shop not available",
    description:"invalid shop",
    urlpath:"shop-not-available",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,    
    available:{
      active:false
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



