var app = require("../app/index");
var mongoose = require("mongoose");

var DbMaintain = mongoose.model('DbMaintain');

describe("DbMaintain", function(){
  var async= require("async");
  var assert = require("assert");
  var _ = require("underscore");
  var fx = require("./fixtures/common");

  var error, log;


  before(function(done){
   fx.clean(function(){      
          done();
    });
  });

  it("Find latest version with no entry", function(done){
    DbMaintain.findLatestVersion(function(err, version){
        assert(!err);
        assert.equal(version, 0);
        done();
     });
  });


  it("First DbMaintain entry", function(done){
    var dbm={
      version: 1,
      log:"standard log",
    };
    DbMaintain.save(dbm, function(err, new_dbm){
        assert(!err);
        assert.equal(new_dbm['version'], dbm['version']);
        done();
    });
  });


  it("Add DbMaintain entry", function(done){
    var dbm={
     version: 2,
      log:"new log",
    };
    DbMaintain.save(dbm, function(err, new_dbm){
        assert(!err);
        assert.equal(new_dbm['version'], dbm['version'])
        done();
    });
  });

  it("Find all entries", function(done){
    DbMaintain.findAll(function(err, version){
        assert(!err);
        assert.equal(version.length, 2);
        done();
     });
  });

  it("Find lates version", function(done){
    DbMaintain.findLatestVersion(function(err, version){
        assert(!err);
        assert.equal(version, 2);
        done();
     });
  });

});