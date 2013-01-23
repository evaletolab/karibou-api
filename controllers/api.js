
/*
 * API introspection
 */
var _ = require('underscore');

exports.index = function(app){
  return function(req, res) {
    var model={ 
      api: app.routes, 
      user: req.user, 
      _:_, 
      filter:/^\/v1\/.*/g 
    };
    res.render('home',  model);
  }
};
