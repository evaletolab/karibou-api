// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose'),
    Shops = db.model('Shops'),
    Products = db.model('Products'),
    validate = require('./validate/validate'),
    _=require('underscore'),
    errorHelper = require('mongoose-error-helper').errorHelper;

function isUserAdminOrWithRole(req, res, next, checkRole){
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if admin, we've done here
  if (req.user.isAdmin()) 
    return next();  

  return checkRole(req, res, next);
}
exports.ensureOwnerOrAdmin=function(req, res, next) {
   
  return isUserAdminOrWithRole(req, res, next,function(){
    function isUserProductOwner(){
      console.log("isUserProductOwner",req.body.sku)
      //return (!_.any(req.user.shops,function(s){return s.sku===req.params.sku}));
      return true;
    }
    //
    // ensure owner
	  if(!isUserProductOwner()){ 
      return res.send(401, "Your are not the owner of this product"); 
	  }
	
    return next();
  }); 

}





exports.create=function (req, res) {
  var product;

  try{  
    validate.check(req.params.shopname, "Vous devez définir une boutique avec un format valide").len(3, 64).isSlug();    
    validate.product(req,res);
  }catch(err){
    return res.send(400, err.message);
  }  
  
  

  Shops.findByUser({id:req.user.id},function (err,shops){
    if (err){
      return res.send(400, errorHelper(err));    
    }
    

    var s=_.find(shops,function(shop){return shop.urlpath===req.params.shopname});
    if (!s){
      return res.send(400, "Vous devez utiliser une boutique qui vous appartient");    
    }

    //
    // ready to create one product
    Products.create(req.body,s, function(err,product){
        if(err){
          return res.send(400, errorHelper(err));    
        }
        res.json(product);            
    });

  });
  


};




// GET to READ

//
// List products
// /v1/products/category/:category
// /v1/products/location/:location
// /v1/products/category/:category/details/:details
// /v1/products/location/:location/category/:category
// /v1/products/location/:location/category/:category/details/:details
// /v1/shops/:shopname/products/category/:category
// /v1/shops/:shopname/products/category/:category/details/:details

exports.list=function (req, res) {
  //
  // check inputs
  
  try{
    validate.ifCheck(req.params.category, "Le format de la catégorie n'est pas valide").isSlug()
    validate.ifCheck(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 64).isSlug();    
    validate.ifCheck(req.params.details, "Le format des détails n'est pas valide").len(1, 34).is(/^[a-z0-9-+.]+$/);    
  }catch(e){
    return res.send(400,e.message);
  }
  var query=_.extend(req.query,req.params);

  
  if(!req.user||!req.user.isAdmin()){
    req.query.status=true;
    if(req.user)req.query.status=req.user.shops;
  }
  
  //
  return Products.findByCriteria(query,function (err, products) {
    var results=products;
    if (err) {
      return res.send(400,err);
    }
    
    //
    // sort=categories.weight
    // as we dont know how to sort cross-documents with mongo
    if (req.query.sort){    
      var sort=req.query.sort.split('.'); 
      //console.log(req.query.sort, sort)
      results=_.sortBy(results,function(product){
          if(sort.length==1){
            return product[sort[0]];
          }else if(sort.length==2){
            if(Array.isArray(product[sort[0]]))
              return product[sort[0]][0][sort[1]];
            return product[sort[0]][sort[1]];
          }else if(sort.length==3){
            return product[sort[0]][sort[1]][sort[2]];
          }
      });
    }


    //
    // group=categories.name
    // as we dont know how to group cross-documents with mongo
    if (req.query.group){   
      var group=req.query.group.split('.'); 
      results=_.groupBy(results,function(product){
          if(group.length==1){
            return product[group[0]];
          }else if(group.length==2){
            if(Array.isArray(product[group[0]]))
              return product[group[0]][0][group[1]];
            return product[group[0]][group[1]];            
          }else if(group.length==3){
            return product[group[0]][group[1]][group[2]];
          }
      });
    }
    
    return res.json(results);
  });
};

//
// Single product
// - by sku
exports.get=function (req, res) {
  return Products.findOneBySku(req.params.sku, function (err, product) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!product){
      return res.send(400,"Ce produit n'existe pas");
    }
    return res.json(product);
  });
};


// PUT to UPDATE

// Bulk update
/*
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
}; */

// Single update
exports.update=function (req, res) {
 //
  // check && validate input field
  try{
    validate.check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();    
    validate.product(req);
  }catch(err){
    return res.send(400, err.message);
  }  
  //
  // with angular in UI we got some issue with the _id value
  function normalizeRef(field){
    return req.body[field]=(req.body[field]&&req.body[field]._id)?req.body[field]._id:req.body[field];
  }
  
  //
  //normalize ref
  req.body.vendor=normalizeRef('vendor');
  req.body.categories=normalizeRef('categories');

  delete(req.body._id);
  Products.findOneAndUpdate({sku:req.params.sku},req.body).populate('vendor').exec(function(err,product){
    if (err){
      return res.send(400,errorHelper(err));    
    }
    return res.json(product);  
  });
};


// remove a single product
exports.remove=function (req, res) {

  try{
    validate.check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();
  }catch(err){
    return res.send(400, err.message);
  }  

  Products.remove({sku:req.params.sku},function(err){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    return res.send(200);
  });
};

