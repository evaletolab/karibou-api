// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose'),
    bus=require('../app/bus'),
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
      Products.findOne({sku:req.params.sku}).exec(function (err,product) {
        var vendor=(product.vendor+'')||'hello';
        if (_.any(req.user.shops,function(s){
          return s._id.equals(vendor);
        })){
          return next();
        };

        return res.status(401).send( "Your are not the owner of this product"); 

      })
    }


    //
    // ensure owner
	  isUserProductOwner();
	
  }); 

}





exports.create=function (req, res) {
  var product;

  try{  
    validate.check(req.params.shopname, "Vous devez définir une boutique avec un format valide").len(3, 64).isSlug();    
    validate.product(req,res);
  }catch(err){
    return res.status(400).send( err.message);
  }  
  
  
  //
  // this is not true for admin user
  Shops.findOneShop({urlpath:req.params.shopname},function (err,shop){
    if (err){
      return res.status(400).send( errorHelper(err));    
    }
    if(!shop){
      return res.status(400).send( 'Vous devez utiliser une boutique qui vous appartient');          
    }
    // var s=_.find(shops,function(shop){return shop.urlpath===req.params.shopname});
    // if (!s){
    //   return res.status(400).send( "Vous devez utiliser une boutique qui vous appartient");    
    // }

    //
    // ready to create one product
    Products.create(req.body,shop, function(err,product){
        if(err){
          return res.status(400).send( errorHelper(err));    
        }

        //
        // log activity
        bus.emit('activity.create',req.user
                               ,{type:'Products',key:'sku',id:product.sku}
                               ,product.getDiff());

        res.json(product);            
    });

  });
  


};


exports.love=function (req, res) {
  // var skus=_.collect(req.user.likes,function(p){return p.sku;})
  var criteria={
    email:req.user.email.address,
    likes:req.user.likes,
    minhit:parseInt(req.query.minhit)||1,
    available:(req.query.available&&req.query.available=='true')
  }

  //
  // we ask for popular 
  if(req.query.popular){
    return Products.findPopular(criteria,function (err,products) {
      if (err) {
        return res.status(400).send(err);
      }
      return res.json(products)    
    }) 
  }

  Products.findBySkus(req.user.likes,function(err,products){
    if (err) {
      return res.status(400).send(err);
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

// get a mix of those lists
// popular, home, love, discount, maxcat

exports.list=function (req, res) {
  //
  // check inputs
  var now =Date.now(), Q=require('q');
  try{
    validate.ifCheck(req.params.category, "Le format de la catégorie n'est pas valide").isSlug()
    validate.ifCheck(req.params.shopname, "Le format du nom de la boutique n'est pas valide").len(3, 64).isSlug();    
    validate.ifCheck(req.params.details, "Le format des détails n'est pas valide").len(1, 34).is(/^[a-z0-9-+.]+$/);    
  }catch(e){
    return res.status(400).send(e.message);
  }
  var query=_.extend(req.query,req.params), 
      popular=[],loves=[],discount=[],home=[],promise,promises=[Q.when([])];// set of products

  
  if(!req.user||!req.user.isAdmin()){
    query.status=true;
    //FIXME WTF is this shit req.query.status=req.user.shops??
    if(req.user)query.status=req.user.shops;
  }else{
    // constraint popular product
    query.email=req.user.email.address;
  }

  // if popular products are requested  
  // options: email, maxcat,likes,available
  if(query.popular){
    promise=Products.findPopular({email:query.email,status:true, available:query.available,maxcat:query.maxcat});
    promises.push(promise);
    promise.then(function(products) {
      // console.log('---------- popular',products.length, Date.now()-now)
      popular=products;
    });
  }

  // in love
  // options user.likes
  if(query.love){
    promise=Products.findBySkus(req.user.likes).exec();
    promises.push(promise);
    promise.then(function(products) {
      // console.log('---------- loves',products.length, Date.now()-now)
      loves=products;
    });
    delete query.love;
  }

  //
  // in home
  if(query.home){
    promise=Products.findByCriteria({status:true,instock:true,available:true,home:true});
    promises.push(promise);
    promise.then(function(products) {
      // console.log('---------- home',products.length, Date.now()-now)
      home=products;
    });
    delete query.home;
  }

  //
  // in discount
  if(query.discount){
    promise=Products.findByCriteria({status:true,instock:true,available:true,discount:true});
    promises.push(promise);
    promise.then(function(products) {
      // console.log('---------- discount',products.length, Date.now()-now)
      discount=products;
    });
    delete query.discount;
  }

  Q.all(promises).then(function(argument) {
    if(query.popular){
      return Products.findPopular({status:true, available:query.available,maxcat:query.maxcat});
    }
    // FIX this approach is working until we have a large amount of products
    return Products.findByCriteria(query);
  }).then(function(products) {

    // console.log('--------------- ALL 0',products.length,Date.now()-now,query);
    var maxcat=query.maxcat||4;

    // unique sku
    function uniq_sku(arr) {
      return _.uniq(arr, function(product, key, a) { 
        return product.sku;
      });
    }

    // group by cat
    function group_cat(arr) {
      return _.groupBy(arr||[],function(p) {
        return p.categories&&p.categories.name||'undefined';
      });
    }

    if(!query.maxcat){
      return res.json(products)
    }

    //
    // replace product by popular

    var groupedP=group_cat(popular);
    var groupedD=group_cat(discount);
    var groupedH=group_cat(home);
    var groupedL=group_cat(loves);
    var groupedA=group_cat(products); // FULL SET OR FULL POPULAR


    //
    // time to fill or replace with 1) discount 2) home
    var result=[], sz,items;
    for(var k in groupedA){
      // init
      console.log('######## cat',k);
      if(!groupedP[k])groupedP[k]=[];
      if(!groupedD[k])groupedD[k]=[];
      if(!groupedH[k])groupedH[k]=[];
      if(!groupedL[k])groupedL[k]=[];
      if(!groupedA[k])groupedA[k]=[];
      items=[];

      // console.log('-------------- PDHLA',k,groupedP[k].length,groupedD[k].length,groupedH[k].length,groupedL[k].length,groupedA[k].length);

      items=items.concat(groupedP[k].slice(0,maxcat-1));
      items=items.concat(groupedD[k]);
      items=items.concat(groupedH[k]);
      items=items.concat(groupedL[k]);
      items=items.concat(groupedA[k]);
      items=uniq_sku(items).slice(0,maxcat);


      result=result.concat(items);
    }
    result=uniq_sku(result);
    // result=_.sortBy(result,function(prod) {
    //     return prod.categories.weight;
    //     // return [prod.category.weight, prod.category.name].join("_");      
    // })
    // console.log('--------------- time 1',Date.now()-now);

    res.json(result);
  }).then(undefined,function(error) {
    res.status(400).send(error);
  })

};

//
// Single product
// - by sku
exports.get=function (req, res) {
  return Products.findOneBySku(req.params.sku, function (err, product) {
    if (err) {
      return res.status(400).send(errorHelper(err));
    }
    if(!product){
      return res.status(400).send("Ce produit n'existe pas");
    }
    return res.json(product);
  });
};

//
// get product SEO
exports.getSEO=function (req, res) {
  return Products.findOneBySku(req.params.sku, function (err, product) {
    if (err) {
      return res.status(400).send(errorHelper(err));
    }
    if(!product){
      return res.status(400).send("Ce produit n'existe pas");
    }
    //
    // setup the model 
    var model={ 
      product: product, 
      user: req.user, 
      _:_,
      weekdays:"Dimanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi".split(','),
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
      return res.status(400).send(errorHelper(err));
    }
    if(!products.length){
      return res.status(400).send("Aucun produit disponible");
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
        weekdays:"Dimanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi".split(','),
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
    return res.status(400).send( err.message);
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
      return res.status(400).send('Ooops, unknow product '+req.params.sku);    
    }

    // if not admin  
    if(!req.user.isAdmin()){
      if(req.body.attributes.home!==undefined && req.body.attributes.home!=product.attributes.home){
        return res.status(401).send( "Your are not allowed to do that, arch!");    
      }

      if(!product.vendor._id.equals(req.body.vendor)){
        return res.status(400).send('Ooops, unknow product vendor '+req.body.vendor);          
      }
    }

    //
    // slug this product
    if(req.body.title&&product.title!==req.body.title){
      product.slug=req.body.title.slug();
    }    

    //
    // log activity
    bus.emit('activity.update',req.user
                           ,{type:'Products',key:'sku',id:product.sku}
                           ,product.getDiff(req.body));

    // do the update
    _.extend(product,req.body)

    product.save(function (err) {
      if (err){
        return res.status(400).send(err.message||errorHelper(err));    
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
    return res.status(400).send( err.message);
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

