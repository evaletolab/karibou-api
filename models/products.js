
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  


var Sizes = new Schema({
    size: { type: String, required: true },
    available: { type: Number, required: true, min: 0, max: 1000 },
    sku: { 
        type: String, 
        required: true, 
        validate: [/[a-zA-Z0-9]/, 'Product sku should only have letters and numbers']
    },
    price: { type: Number, required: true, min: 0 }
});

var Images = new Schema({
    kind: { 
        type: String, 
        enum: ['thumbnail', 'catalog', 'detail', 'zoom'],
        required: true
    },
    url: { type: String, required: true }
});


var Variants = new Schema({
    color: String,
    images: [Images],
    sizes: [Sizes]
});



var Categories = new Schema({
    name: String
});



var Catalogs = new Schema({
    name: String
});


// Product Model

var Product = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    style: { type: String, unique: true },
    images: [Images],
    categories: [Categories],
    catalogs: [Catalogs],
    variants: [Variants],
    modified: { type: Date, default: Date.now }
});



// validation

Product.path('title').validate(function (v) {
    console.log("validate title");
    console.log(v);
    return v.length > 10 && v.length < 70;
});



Product.path('style').validate(function (v) {
    console.log("validate style");
    console.log(v);
    return v.length < 40;
}, 'Product style attribute is should be less than 40 characters');


Product.path('description').validate(function (v) {
    console.log("validate description");
    console.log(v);
    return v.length > 10;
}, 'Product description should be more than 10 characters');


//
//
module.exports = mongoose.model('Products', Product);


/* Product Document 
[
{  
  "title": "My Awesome T-shirt",  
  "description": "All about the details. Of course it's black.",  
  "images": [  
    {  
      "kind": "thumbnail",  
      "url": "images/products/1234/main.jpg"  
    }  
  ],  
  "categories": [  
      { "name": "Clothes" },  
      { "name": "Shirts" }  
  ],  
  "style": "1234",  
  "variants": [  
    {  
      "color": "Black",  
      "images": [  
        {  
          "kind": "thumbnail",  
          "url": "images/products/1234/thumbnail.jpg"  
        },  
        {  
          "kind": "catalog",  
          "url": "images/products/1234/black.jpg"  
        }  
      ],  
      "sizes": [  
        {  
          "size": "S",  
          "available": 10,  
          "sku": "CAT-1234-Blk-S",  
          "price": 99.99  
        },  
        {  
          "size": "M",  
          "available": 7,  
          "sku": "CAT-1234-Blk-M",  
          "price": 109.99  
        }  
      ]  
    }  
  ],  
  "catalogs": [  
      { "name": "Apparel" }  
  ]  
}
]
*/


