var ObjectId = require('mongodb').ObjectID;

var Users=exports.Users=[{
    _id : ObjectId('515ec12e56a8d5961e000444'), 
    status:true,
    addresses : [], 
    created : new Date("2013-03-27T17:07:34.201Z"), 
    id : 12345, 
    invoices : [], 
    likes : [], 
    displayName : "olvier e", 
    email : { 
      address : "evaleto@gluck.com", status : new Date()
    },
    phoneNumbers : [], 
    photo : "jpg", 
    provider : "local", 
    roles : [], 
    shops : ['515ec12e56a8d5961e000004'], 
    tags : [],
    provider: 'local',
    password:'password'
  },{
    _id : new ObjectId(), 
    status:true,
    addresses : [], 
    created : new Date("2013-03-27T17:07:34.201Z"), 
    id : 12346, 
    invoices : [], 
    likes : [], 
    displayName : "olvier pluck", 
    email : { 
      address : "evaleto@gmail.com", status : new Date()
    },
    phoneNumbers : [], 
    photo : "jpg", 
    provider : "local", 
    roles : [], 
    shops : [], 
    tags : [],
    password:'password'
  },{
    _id : new ObjectId(), 
    status:true,
    addresses : [], 
    created : new Date("2013-03-27T17:07:34.201Z"), 
    invoices : [], 
    likes : [], 
    phoneNumbers : [], 
    roles : [], 
    shops : [], 
    tags : [],
    provider:"twitter",
    id:312528659,
    photo:"https: //si0.twimg.com/profile_images/1385850059/oli-avatar-small_normal.png",
    roles:["admin", "mod"],
  }
];




