// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose');
var Shops = db.model('Shops');
var Products = db.model('Products');
var Manufacturers = db.model('Manufacturers');
var assert = require("assert");
var _=require('underscore');

exports.create=function (req, res) {
  var product;
  
  //console.log("body:",req.body);
  
  
  //
  // check shop owner 
  assert(req.params.shopname);    
  Shops.findByUser({id:req.user.id},function (err,shops){
    if (err){
    	res.status(401);
      return res.json({error:err});    
    }
    
    var s=_.find(shops,function(shop){return shop.urlpath===req.params.shopname});
    if (!s){
    	res.status(401);
      return res.json({error:"Shops is not defined or not associed to the user"});    
    }

    //
    // manufacturer
    if(req.query.manufacurer){
      Manufacturers.map("_id", req.query.manufacurer, function(err,makers){
      });
    }

    //
    // category
    if(req.query.category){
      Categories.map("_id", req.query.category, function(err,category){
      });
    }
    
    //
    // ready to create one product
    Products.create(req.body,req.user, function(err,product){
      if(err){
      	res.status(401);
        return res.json({error:err});
      }      
      res.json(product);
    });
    
  });
  


};

exports.shopCreate=function (req, res) {

  db.model('Shops').create(req.body, req.user, function(err,shop){
    if(err){
      //TODO error
    	res.status(401);
      return res.json({error:err});
    }      
    res.json(shop);
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
  // shop is defined
  if (req.params.shopname){
  }
  
  //
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
exports.massUpdate= function (req, res) {
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
exports.massRemove=function (req, res) {
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

