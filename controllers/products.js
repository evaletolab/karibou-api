// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose');
var Products = db.model('Products');

exports.create=function (req, res) {
  var product;
  
  console.log("user:",req.user);
  console.log("body:",req.body);
  
  Shops.findByUser({id:req.user.id},function(err,shop){
    assert(shop);
    Products.create(req.body, function(err,product){
      if(err){
        //TODO error
      	res.status(401);
        return res.json({error:err});
      }      
      console.log(product);
      res.json(product);
    });
  });


};


// GET to READ

//
// List products
// - by category    
//   /v1/products?c=fruits,légume

// - by details 
//   /v1/products?a=bio,glutenfree

// - by manufacturer
//   /v1/products?m=Olivier Evalet
// - by shop
// - by vendor
exports.list=function (req, res) {
  return Products.find(function (err, products) {
    if (err) {
    	res.status(401);
      return res.json({error:err});
    }
    return res.json(products);
  });
};

//
// Single product
// - by sku
exports.get=function (req, res) {
  return Products.findById(req.params.sku, function (err, product) {
    if (err) {
    	res.status(401);
      return res.json({error:err});
    }
    return res.json(product);
  });
};


// PUT to UPDATE

// Bulk update
exports.mass_update= function (req, res) {
    var i, len = 0;
    console.log("is Array req.body.products");
    console.log(Array.isArray(req.body.products));
    console.log("PUT: (products)");
    console.log(req.body.products);
    if (Array.isArray(req.body.products)) {
        len = req.body.products.length;
    }
    for (i = 0; i < len; i++) {
        console.log("UPDATE product by id:");
        for (var id in req.body.products[i]) {
            console.log(id);
        }
        ProductModel.update({ "_id": id }, req.body.products[i][id], function (err, numAffected) {
            if (err) {
                console.log("Error on update");
                console.log(err);
            } else {
                console.log("updated num: " + numAffected);
            }
        });
    }
    return res.send(req.body.products);
};

// Single update
exports.update=function (req, res) {
  return ProductModel.findById(req.params.id, function (err, product) {
    product.title = req.body.title;
    product.description = req.body.description;
    product.style = req.body.style;
    product.images = req.body.images;
    product.categories = req.body.categories;
    product.catalogs = req.body.catalogs;
    product.variants = req.body.variants;
    return product.save(function (err) {
      if (!err) {
        console.log("updated");
      } else {
        console.log(err);
      }
      return res.send(product);
    });
  });
};


// Bulk destroy all products
exports.mass_remove=function (req, res) {
  ProductModel.remove(function (err) {
    if (!err) {
      console.log("removed");
      return res.send('');
    } else {
      console.log(err);
    }
  });
};

// remove a single product
exports.remove=function (req, res) {
  return ProductModel.findById(req.params.id, function (err, product) {
    return product.remove(function (err) {
      if (!err) {
        console.log("removed");
        return res.send('');
      } else {
        console.log(err);
      }
    });
  });
};

