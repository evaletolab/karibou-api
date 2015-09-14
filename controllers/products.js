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
      if(!req.body){
        return false;
      }
      var vendor=(req.body.vendor._id||req.body.vendor)+'';
      return (_.any(req.user.shops,function(s){
        return s._id.equals(vendor);
        // return (s._id+'')===vendor;
      }));
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
  
  
  //
  // this is not true for admin user
  Shops.findOneShop({urlpath:req.params.shopname},function (err,shop){
    if (err){
      return res.send(400, errorHelper(err));    
    }
    if(!shop){
      return res.send(400, 'Vous devez utiliser une boutique qui vous appartient');          
    }
    // var s=_.find(shops,function(shop){return shop.urlpath===req.params.shopname});
    // if (!s){
    //   return res.send(400, "Vous devez utiliser une boutique qui vous appartient");    
    // }

    //
    // ready to create one product
    Products.create(req.body,shop, function(err,product){
        if(err){
          return res.send(400, errorHelper(err));    
        }
        res.json(product);            
    });

  });
  


};


exports.love=function (req, res) {
  // var skus=_.collect(req.user.likes,function(p){return p.sku;})
  var criteria={
    email:req.user.email.address,
    likes:req.user.likes,
    minhit:req.query.minhit||1,
    available:req.query.available
  }

  //
  // we ask for popular 
  if(req.query.popular){
    return Products.findPopularByUser(criteria,function (err,products) {
      if (err) {
        return res.send(400,err);
      }
      return res.json(products)    
    }) 
  }

  Products.findBySkus(req.user.likes,function(err,products){
    if (err) {
      return res.send(400,err);
    }
    return res.json(products)    
  })
}


// find all products for the current user
exports.findByOwner=function (req, res) {
    
    return res.json([]);
};


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
    //FIXME WTF is this shit req.query.status=req.user.shops??
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

//
// get product SEO
exports.getSEO=function (req, res) {
  return Products.findOneBySku(req.params.sku, function (err, product) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!product){
      return res.send(400,"Ce produit n'existe pas");
    }
    //
    // setup the model 
    var model={ 
      product: product, 
      user: req.user, 
      _:_,
      prependUrlImage:function (url) {
        if(url&&url.indexOf('//')===0){
          url='https:'+url;
        }
        return url;
      }
    };

    return res.render('product', model);
  });
};


//
// get product SEO
exports.allSEO=function (req, res) {

  var query={
    status:true,
    available:true
  }
  if(req.params.category){
    query.category=req.params.category;
  }
  
  return Products.findByCriteria(query,function (err, products) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!products.length){
      return res.send(400,"Aucun produit disponible");
    }

    //
    // get the list of cats
    db.model('Categories').find({},function (err,cats) {
      //
      // setup the model 
      var model={ 
        categories:cats,
        products: products, 
        user: req.user, 
        _:_,
        prependUrlImage:function (url) {
          if(url&&url.indexOf('//')===0){
            url='https:'+url;
          }
          return url;
        }
      };

      return res.render('products', model);
    })

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
  req.body.updated=Date.now();

  delete(req.body._id);
  delete(req.body.sku);
  //
  //body clean (avoid mongo warn !) 
  req.body.$promise && delete(req.body.$promise);
  req.body.$resolved && delete(req.body.$resolved);
  
  Products.findOne({sku:req.params.sku}).populate('vendor').exec(function(err,product){
    if (!product){
      return res.send(400,'Ooops, unknow product '+req.params.sku);    
    }

    // if not admin  
    if(!req.user.isAdmin()){
      if(req.body.attributes.home!==undefined && req.body.attributes.home!=product.attributes.home){
        return res.send(401, "Your are not allowed to do that, arch!");    
      }

      if(!product.vendor._id.equals(req.body.vendor)){
        return res.send(400,'Ooops, unknow product vendor '+req.body.vendor);          
      }
    }

    // do the update
    _.extend(product,req.body)

    product.save(function (err) {
      if (err){
        return res.send(400,err.message||errorHelper(err));    
      }
      return res.json(product);  
    })
  });
};


// remove a single product
exports.remove=function (req, res) {

  try{
    validate.check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();
  }catch(err){
    return res.send(400, err.message);
  }  

  //TODO remove do not trigger post middleware, use find and remove
  Products.find({sku:req.params.sku}).remove(function(err){
    if (err){
    	res.status(400);
      return res.json(err);    
    }
    return res.send(200);
  });
};

