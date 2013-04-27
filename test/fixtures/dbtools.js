
var async     = require("async");  
var db  = require("mongoose");

var fx = require('pow-mongoose-fixtures');


exports.clean=function(callback){
  var collections=['Users','Categories','Shops','Products','Sequences','DbMaintain', 'Emails'];
  var iterator = function(name, nextcb){
    db.model(name).remove({},function(e){
      nextcb(e);
    });
  };
  async.forEach(collections, iterator,callback);
};

exports.fixtures=function(names){
  var data={};
  names.forEach(function(name) {
    var fx=require('../fixtures/'+name);
    Object.keys(fx).forEach(function(model){
      data[model]=fx[model];
    });
  });
  return data;
}
exports.load=function(fixtures, cb, callback){
  var iterator = function(fixture, nextcb){
        fx.load(fixture,db, nextcb);
  };
  async.forEach(fixtures, iterator,callback);
}


