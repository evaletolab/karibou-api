
/*
 * API introspection
 */
var _ = require('underscore');

exports.index = function(app){
  return function(req, res) {
    var model={ 
      api: app.routes, 
      user: req.user, 
      filter:function(api){
        return _.filter(api, function(route){return route.path.indexOf("/v1")>-1;});
      } 
    };
    res.render('home',  model);
  }
};


exports.config = function(req, res) {
    config.shop.env=process.env;
    res.json(config.shop);
};
