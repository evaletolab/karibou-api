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
    created : new Date("2013-03-27T17:07:34.201Z"), 
    id : 12346, 
    invoices : [], 
    likes : [], 
    displayName : "olvier pluck", 
    email : { 
      address : "evaleto@gmail.com", status : true
    },
    addresses: [
        {
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            location: "Genève-Ville",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "GE"
        }
    ],
    phoneNumbers: [
        {
            number: "076 3787968",
            what: "principal"
        }
    ],
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




