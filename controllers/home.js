
/*
 * home
 */

var db=require('../app/config');
var _=require('underscore');

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
