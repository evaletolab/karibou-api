var ObjectId = require('mongodb').ObjectID;
var Categories=require('./Categories');
var data=require('./Users');
var now=new Date(), h24=86400000;
now.setHours(0,0,0,0);

console.log('--------------- now.plusDays(1)',now.plusDays(1))
console.log('--------------- now.plusDays(2)',now.plusDays(2))
// shop[0](id:0004, status:true, owner:gluck)
// shop[1](id:0005, status:false, owner:gmail)
// shop[2](id:0006, status:Date.now, owner:gluck)

// this shop is closed
exports.Shops=[{
    /*shop status ==true */  
    _id:ObjectId('515ec12e56a8d5961e000004'),
    status:true,
    name: "Un autre shop",
    description:"cool ce shop",
    urlpath:"closed-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:true,
      from:now,
      to:now.plusDays(8),
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
  },{
    /*shop is never open */
    _id:ObjectId('515ec12e56a8d5961e000005'),
    status:true,
    name: "mon shop",
    description:"cool ce shop",
    urlpath:"never-open-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[1]._id,
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:false,
      weekdays:[]
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
    /* this shop is always open */
    _id:ObjectId('515ec12e56a8d5961e000006'),
    status:true,
    name: "always-open shop",
    description:"always-open shop",
    urlpath:"always-open-shop",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,    
    photo:{ 
      bg:"http://image.truc.io/bg-01123.jp",
      fg:"http://image.truc.io/fg-01123.jp"      
    },
    available:{
      active:false,
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
    /* shop only closed today  */
    _id:ObjectId('515ec12e56a8d5961e000007'),
    status:true,
    name: "shop-not-available-tomorrow",
    description:"shop-not-available-tomorrow",
    urlpath:"shop-not-available-tomorrow",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,    
    available:{
      active:true,
      from:now.plusDays(1),
      to:now.plusDays(2),
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
    /* shop only available sunday  */
    _id:ObjectId('515ec12e56a8d5961e000008'),
    status:true,
    name: "shop-oneday-available",
    description:"shop-oneday-available",
    urlpath:"shop-oneday-available",
    catalog:Categories.Categories[0]._id,
    owner:data.Users[0]._id,    
    available:{
      active:false,
      from:now,
      to:now.plusDays(7),
      weekdays:[0]
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



