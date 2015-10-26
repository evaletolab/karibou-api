// from
// http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

require('../app/config');
var db = require('mongoose'),
    Shops = db.model('Shops'),
    Documents = db.model('Documents'),
    validate = require('./validate/validate'),
    _=require('underscore'),
    errorHelper = require('mongoose-error-helper').errorHelper;


exports.ensureOwnerOrAdmin=function(req, res, next) {   
  function isUserDocumentOwner () {
    Documents.findByOwner({uid:req.user.id,slug:req.params.slug},function(err,docs){
      if(!docs.length){
        return res.send(401, "Your are not the owner of this doc");           
      }
      return next();
    });
  }
  if(!req.params.slug){
    return res.send(400,"You have to specify a document (slug)");
  }

  if(req.user&&req.user.isAdmin()){
    return next();
  }

  //
  // ensure owner
  isUserDocumentOwner();

}





exports.create=function (req, res) {

  try{  
    // validate.document(req,res);
  }catch(err){
    return res.send(400, err.message);
  }  
  
  
  //
  // ready to create one doc
  Documents.create(req.body,req.user.id, function(err,doc){
      if(err&&err.code==11000){
        return res.send(400,"Cet document existe déjà");    
      }
      else if(err){
        return res.send(400, errorHelper(err));    
      }
      res.json(doc);            
  });


};

exports.findByOwner=function (req, res) {
  Documents.findByCriteria({uid:req.user.id},function(err,docs){
    if (err) {
      return res.send(400,err);
    }
    return res.json(docs)    
  });
};


exports.findBySkus=function (req, res) {
  Documents.findByCriteria({skus:req.query.skus},function(err,docs){
    if (err) {
      return res.send(400,err);
    }
    return res.json(docs)    
  });
};

exports.findByCategory=function (req, res) {
  Documents.findByCriteria({skus:req.query.skus},function(err,docs){
    if (err) {
      return res.send(400,err);
    }
    return res.json(docs)    
  });
};


//
// Single doc by his SLUG
exports.get=function (req, res) {

  return Documents.findOneBySlug({slug:req.params.slug,type:req.params.category}, function (err, doc) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!doc){
      return res.send(400,"Ce document n'existe pas");
    }
    //
    // fetch products associated with this doc
    if(doc.skus){
      return Documents.model('Products').findBySkus(doc.skus,function (err,products) {
        var result=doc.toObject();
        result.products=products;
        return res.json(result);
      });
    }
    return res.json(doc);
  });
};

//
// get doc SEO
exports.getSEO=function (req, res) {
  return Documents.findOneBySlug(req.params.slug, function (err, doc) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!doc){
      return res.send(400,"Ce document n'existe pas");
    }
    //
    // fetch products associated with this doc
    Documents.model('Products').findBySkus(doc.skus,function (err,products) {

      //
      // setup the model 
      var model={ 
        doc: doc, 
        products:products,
        user: req.user, 
        _:_,
        prependUrlImage:function (url) {
          if(url&&url.indexOf('//')===0){
            url='https:'+url;
          }
          return url;
        }
      };

      return res.render('document', model);

    })
  });
};


//
// get product SEO
exports.allSEO=function (req, res) {
/**
  var query={
    status:true,
    available:true
  }
  if(req.params.category){
    query.category=req.params.category;
  }
  
  return Documents.findByCriteria(query,function (err, products) {
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
*/
};

// Single update
exports.update=function (req, res) {
 //
  // check && validate input field
  try{
    validate.check(req.params.slug, "Le format SLUG du document n'est pas valide").len(3, 104).isSlug();    
    // validate.document(req);
  }catch(err){
    return res.send(400, err.message);
  }  

  req.body.updated=Date.now();

  delete(req.body._id);
  //
  //body clean (avoid mongo warn !) 
  req.body.$promise && delete(req.body.$promise);
  req.body.$resolved && delete(req.body.$resolved);
  
  Documents.findOne({slug:req.params.slug}).exec(function(err,doc){
    if (!doc){
      return res.send(400,'Ooops, unknow doc '+req.params.slug);    
    }

    // if not admin  
    if(!req.user.isAdmin()){
      req.body.owner=doc.owner;
      req.body.created=doc.created;
    }

    // 
    // slug this doc TODO the slug change the final url && url can be bookmarked!! WE SHOULD SAVE SLUG VERSIONS
    if(req.body.title&&doc.title!==req.body.title){
      doc.slug=req.body.title.slug();
    }    

    // do the update
    _.extend(doc,req.body)

    doc.save(function (err) {
      if (err){
        return res.send(400,err.message||errorHelper(err));    
      }
      return res.json(doc);  
    })
  });
};


// remove a single doc
exports.remove=function (req, res) {

  try{
    validate.check(req.params.slug, "Le format SLUG du produit n'est pas valide").len(3, 100).isSlug();
  }catch(err){
    return res.send(400, err.message);
  }  

  //TODO remove do not trigger post middleware, use find and remove
  Documents.find({slug:req.params.slug}).remove(function(err){
    if (err){
      return res.json(400,err);    
    }
    return res.send(200);
  });
};

