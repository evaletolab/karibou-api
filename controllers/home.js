
/*
 * home
 */

var db = require('mongoose'),
    Shops = db.model('Shops'),
    Products = db.model('Products'),
    validate = require('./validate/validate'),
    _=require('underscore'),
    errorHelper = require('mongoose-error-helper').errorHelper;

exports.index = function(app){
  return function(req, res) {
    var model={ 
      api: app.routes, 
      user: req.user, 
      _:_, 
      filter:function(api){
        return _.filter(api, function(route){return route.path.indexOf("/v1")==-1;});
      } 
    };
    res.render('home',  model);
  }
};

exports.welcome = function(req,res){
    res.render('welcome');
};



//
// get product SEO
exports.SEO=function (req, res) {

  var query={
    status:true,
    available:true
  }
  return Products.findByCriteria(query,function (err, products) {
    if (err) {
      return res.send(400,errorHelper(err));
    }
    if(!products.length){
      return res.send(400,"Aucun produit disponible");
    }
    //
    // setup the model 
    var model={ 
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

    return res.render('homeseo', model);
  });
};
