
/*
 * home
 */

var db=require('../models/config');

exports.index = function(req, res) {
  res.render('home',  { user: req.user });
};
