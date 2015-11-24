
var async     = require("async");  
var db  = require("mongoose");

var fx = require('pow-mongoose-fixtures');


exports.clean=function(callback){
  if (process.env.NODE_ENV!=='test'){
    console.log('cannot run test without test environement: NODE_ENV=test mocha')
    process.exit(1);
  }

  var collections=['Users','Categories','Shops','Products','Sequences','DbMaintain', 'Emails','Wallets'];
  var iterator = function(name, nextcb){
    db.model(name).remove({},function(e){
      nextcb(e);
    });
  };
  async.forEach(collections, iterator,callback);
};

exports.fixtures=function(names){
  if (process.env.NODE_ENV!=='test'){
    console.log('cannot run test without test environement: NODE_ENV=test mocha')
    process.exit(1);
  }
    
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
  if (process.env.NODE_ENV!=='test'){
    console.log('cannot run test without test environement: NODE_ENV=test mocha')
    process.exit(1);
  }

  var iterator = function(fixture, nextcb){
        fx.load(fixture,db, nextcb);
  };
  async.forEach(fixtures, iterator,callback);
}


