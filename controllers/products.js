// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose');
var Shops = db.model('Shops');
var Products = db.model('Products');
var _=require('underscore');

var check = require('validator').check,
    sanitize = require('validator').sanitize;

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
exports.ensureShopOwnerOrAdmin=function(req, res, next) {
  return isUserAdminOrWithRole(req, res, next,function(){
    function isUserShopOwner(){
      return (!_.any(req.user.shops,function(s){return s.urlpath===req.body.owner.urlpath}));
    }
    //
    // ensure owner
	  if(!isUserShopOwner()){ 
      return res.send(401, "Your are not the owner of the shop"); 
	  }
	
    return next();
  }); 
}


function checkParams(req){
    if (!req.body)return;
    if(req.body.title) check(req.body.title,"Le nom de votre produit n'est pas valide").len(3, 34).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    
    
    if(req.body.details){
      check(req.body.details.description).len(3, 34).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
      req.body.details.bio && check(req.body.details.bio).is(/^(true|false)$/);
      req.body.details.gluten && check(req.body.details.gluten).is(/^(true|false)$/);
      req.body.details.lactose && check(req.body.details.lactose).is(/^(true|false)$/);
      req.body.details.local && check(req.body.details.local).is(/^(true|false)$/);

    }else{
      throw new Error("Vous devez définir une description");
    }
    
    if(req.body.pricing){
      check(req.body.pricing.price, "La valeur du prix n'est pas correct").isFloat();
      req.body.pricing.discount&&check(req.body.pricing.discount, "La valeur du discount n'est pas correct").isFloat();
      
      check(req.body.pricing.stock, "La valeur du stock n'est pas correct").isInt();
      check(req.body.pricing.part, "La valeur d'une partie n'est pas correct").isAlphanumeric();
    }else{
      throw new Error("Vous devez définir un prix");
    }

    if (req.body.photo){
      req.body.photo.bg && check(req.body.photo.bg).len(6, 164).isUrl();
      req.body.photo.fg && check(req.body.photo.fg).len(6, 164).isUrl();
      req.body.photo.owner && check(req.body.photo.owner).len(6, 164).isUrl();
    }
        
    
    if (req.body.available){
      req.body.available.active && check(req.body.available.active).is(/^(true|false)$/);
      req.body.available.comment && check(req.body.available.comment,"Le format du commentaire n'est pas valide").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }

    if (req.body.info){
      req.body.info.active && check(req.body.info.active).is(/^(true|false)$/);
      req.body.info.comment && check(req.body.info.comment,"Le format du commentaire n'est pas valide").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }
      
    
}

exports.create=function (req, res) {
  var product;

  try{  
    checkParams(req,res);
  }catch(err){
    return res.send(400, err.message);
  }  
  
  
  //
  // check shop owner 
  if(!req.params.shopname){ 
    return res.json(400,"Vous devez définir une boutique")
  }
  Shops.findByUser({id:req.user.id},function (err,shops){
    if (err){
      return res.json(400, err);    
    }
    

    var s=_.find(shops,function(shop){return shop.urlpath===req.params.shopname});
    if (!s){
      return res.json(400, "Vous devez utiliser une boutique qui vous appartient");    
    }

    //
    // ready to create one product
    Products.create(req.body,s, function(err,product){
        if(err){
          return res.json(400, err);    
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

  }catch(e){
    return res.json(400,e);
  }
  
  //
  return Products.findByCriteria(req.params,function (err, products) {
    if (err) {
      return res.json(400,err);
    }
    //
    // as we dont know how to group by with mongo
    if (req.query.group){
      grouped=_.groupBy(products,function(product){
        return product.categories.length&&product.categories[0];
      });
      return res.json(grouped);
    }
    
    return res.json(products);
  });
};

//
// Single product
// - by sku
exports.get=function (req, res) {
  return Products.findOneBySku(req.params.sku, function (err, product) {
    if (err) {
      return res.json(400,err);
    }
    if(!product){
      return res.json(400,"Ce produit n'existe pas");
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
 //
  // check && validate input field
  try{
    check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();    
    checkParams(req);
  }catch(err){
    return res.send(400, err.message);
  }  

  //
  //normalize ref
  req.body.vendor=(req.body.vendor&&req.body.vendor._id)?req.body.vendor._id:req.body.vendor;
  delete(req.body._id);
  Products.findOneAndUpdate({sku:req.params.sku},req.body,function(err,product){
    if (err){
      return res.json(400,err);    
    }
    return res.json(product);  
  });
};


// remove a single product
exports.remove=function (req, res) {

  try{
    check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();
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

