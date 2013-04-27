var app = require("../app/index");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js"]);

var DbMaintain = db.model('DbMaintain');


describe("DbMaintain", function(){
  var _ = require("underscore");

  var error, log;


  before(function(done){
    dbtools.clean(function(){      
      done();
    });
  });

  it("Find latest version with no entry", function(done){
    DbMaintain.findLatestVersion(function(err, version){
        should.not.exist(err);
        version.should.equal(0);
        done();
     });
  });


  it("First DbMaintain entry", function(done){
    var dbm={
      version: 1,
      log:"standard log",
    };
    DbMaintain.save(dbm, function(err, new_dbm){
        should.not.exist(err);
        new_dbm['version'].should.equal(dbm['version'])
        done();
    });
  });


  it("Add DbMaintain entry", function(done){
    var dbm={
     version: 2,
      log:"new log",
    };
    DbMaintain.save(dbm, function(err, new_dbm){
        should.not.exist(err);
        new_dbm['version'].should.equal(dbm['version'])
        done();
    });
  });

  it("Find all entries", function(done){
    DbMaintain.findAll(function(err, version){
        should.not.exist(err);
        version.length.should.equal(2);
        done();
     });
  });

  it("Find lates version", function(done){
    DbMaintain.findLatestVersion(function(err, version){
        should.not.exist(err);
        version.should.equal(2);
        done();
     });
  });

});
