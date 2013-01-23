
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
      filter:/^\/[^v].*/g};
    res.render('home',  model);
  }
};
