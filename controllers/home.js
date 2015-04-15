
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


exports.SEO = function(req,res){
    res.render('homeseo');
};

