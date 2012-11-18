
/*
 * home
 */

var db=require('../app/config');

exports.index = function(req, res) {
  res.render('home',  { user: req.user });
};
