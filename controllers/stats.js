
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    sm = require('sitemap'),
    db = require('mongoose'),
    http = require('http'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    debug = require('debug')('api'),
    errorHelper = require('mongoose-error-helper').errorHelper;



/**
 * get matrix products vs users
 */
exports.favoriteProductsVsUsers = function(req,res){
  db.model('Orders').favoriteProductsVsUsers(function (err, stats) {
    if(err){
      return res.send(400, errorHelper(err.message||err));
    }
    res.json(stats);
  })
};


/**
 * Compute CA grouped by Year and Week
 */
exports.getSellValueByYearAndWeek = function(req,res){
  db.model('Orders').getSellValueByYearAndWeek({},function (err, stats) {
    if(err){
      return res.send(400, errorHelper(err.message||err));
    }
    res.json(stats);
  })
};

/**
 * Compute CA grouped by Year and Week
 */
exports.getCAByYearMonthAndVendor = function(req,res){
  var filter={};
  if(req.params.shopname){
    filter['items.vendor']=req.params.shopname;
  }
  if(req.query.month){
    filter['month']=req.query.month;
  }

  db.model('Orders').getCAByYearMonthAndVendor(filter,function (err, stats) {
    if(err){
      return res.send(400, errorHelper(err.message||err));
    }
    res.json(stats);
  })
};
