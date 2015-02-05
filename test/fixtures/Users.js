var ObjectId = require('mongodb').ObjectID;

var Users=exports.Users=[{
    _id : ObjectId('515ec12e56a8d5961e000444'), 
    status:true,
    addresses: [
        {
            name: "famille Joe Dalton",
            note: "123456",
            streetAdress: "route de crouge 11",
            floor: "1",
            postalCode: "1205",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève"
        }
    ],
    created : new Date("2013-03-27T17:07:34.201Z"), 
    id : 12345, 
    invoices : [], 
    likes : [], 
    displayName : "olvier e", 
    email : { 
      address : "evaleto@gluck.com", status : true
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
    //Users[1]
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
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève"
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
    shops : ['515ec12e56a8d5961e000006'], 
    tags : [],
    password:'password'
  },{
    //Users[2]
    _id : new ObjectId(), 
    password: "password",
    tags: [],
    shops: [],
    roles: [],
    provider: "local",
    photo: "jpg",
    phoneNumbers: [
        {
            what: "principal",
            number: "076 3787968"
        }
    ],
    addresses: [
        {
            region: "Genève",
            primary: true,
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet"
        }
    ],
    email: {
        status: true,
        address: "delphine@gmail.com"
    },
    displayName: "delphine pluck",
    likes: [],
    invoices: [],
    id: 12347,
    created: "2012-03-27T17:07:34.201Z",
    status: true,
  },{
    //Users[3]
    _id : new ObjectId(), 
    password: "password",
    tags: [],
    shops: [],
    roles:["admin", "mod"],
    provider: "local",
    photo: "jpg",
    phoneNumbers: [
        {
            what: "principal",
            number: "076 3787968"
        }
    ],
    addresses: [
        {
            region: "Genève",
            primary: true,
            geo: {
                lng: 6.1692497,
                lat: 46.1997473
            },
            postalCode: "1204",
            floor: "1",
            streetAdress: "rue de carouge",
            note: "",
            name: "famille delphine evalet"
        }
    ],
    email: {
        status: true,
        address: "testpsp@gmail.com"
    },
    displayName: "delphine pluck",
    likes: [],
    invoices: [],
    id: 1279482741765243,
    created: "2012-03-27T17:07:34.201Z",
    status: true,
  }
];




