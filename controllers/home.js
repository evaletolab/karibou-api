
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
      api: app._router.stack, 
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
    var lang=req.session.lang||config.shared.i18n.defaultLocale;

    //
    // get the list of cats
    db.model('Categories').find({},function (err,cats) {
      //
      // setup the model 
      var model={ 
        categories:cats,
        user: req.user, 
        _:_,
        getLocal:function(item){
          if(item) return item[lang];return item;
        },
        prependUrlImage:function (url) {
          if(url&&url.indexOf('//')===0){
            url='https:'+url;
          }
          return url;
        }
      };

      return res.render('homeseo', model);
    })

};

