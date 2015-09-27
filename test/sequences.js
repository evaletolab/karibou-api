// Use a different DB for tests
var app = require("../app"),
    db = require('mongoose'),
    dbtools = require("./fixtures/dbtools"),
    should = require("should");


describe("sequences", function(){

  var SKU=db.model('Sequences').initNumber('sku');
  before(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });


  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  it("First SKU ", function(done){
    db.model('Sequences').nextSku(function(err,sku){
      sku.should.equal(SKU);
      done();
    });
  });

  it("Next SKU, ", function(done){
    db.model('Sequences').nextSku(function(err,sku){
      sku.should.equal(SKU+1);
      done();
    });
  });

  it("Next SKU, ", function(done){
    db.model('Sequences').next('sku',function(err,sku){
      sku.should.equal(SKU+2);
      done();
    });
  });

  it("Next SKU with promise ", function(done){
    db.model('Sequences').nextSku().then(function(sku){
      sku.should.equal(SKU+3);
      done();
    });
  });


  it("Race condition without init",function (done) {
    require("async").parallelLimit([
      function(cb){
        db.model('Sequences').next('sku',cb);
      },
      function(cb){
        db.model('Sequences').next('sku',cb);
      },
      function(cb){
        db.model('Sequences').next('sku',cb);
      },
      function(cb){
        db.model('Sequences').nextSku(cb);
      }
    ],4, function(err,seq){
      seq.length.should.equal(4)
      seq.should.containEql(1000004)
      seq.should.containEql(1000005)
      seq.should.containEql(1000006)
      seq.should.containEql(1000007)
      done()
    });


  })

  it.skip("Race condition with promise",function (done) {
    require("async").parallelLimit([
      function(cb){
        db.model('Sequences').next('other',cb);
      },
      function(cb){
        db.model('Sequences').next('other',cb);
      },
      function(cb){
        db.model('Sequences').next('other',cb);
      },
      function(cb){
        db.model('Sequences').next('other',cb);
      }
    ],4, function(err,seq){
      done()
    });


  })
          


});

