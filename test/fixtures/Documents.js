var ObjectId = require('mongodb').ObjectID;

// 12345 ==> evaleto@gluck.com 
// 12346 ==> evaleto@gmail.com
// 12347 ==> delphine@gmail.com

exports.Documents=[{    
    title: 'fixture titre',
    slug:  'fixture-titre',
    header:'##test1',
    content:'##test1',
    photo:{
      header:'http://photooooz',
      bundle:['http://photooooz']
    },

    created: new Date(),
    updated: new Date(),
    available:true,
    published:false,

    skus:[12345,12346,12347],
    type: 'page',
    owner:12345  
  }
];



