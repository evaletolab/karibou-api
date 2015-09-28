var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var _ = require("underscore");
var request= require('supertest');
var when16=new Date('Tue Dec 16 2014 16:00:00 GMT+0100 (CET)'),
    when19=new Date('Fri Dec 19 2014 16:00:00 GMT+0100 (CET)'),
    when23=new Date('Tue Dec 23 2014 16:00:00 GMT+0100 (CET)'),
    Orders=db.model('Orders');

describe("api.orders.find", function(){
  before(function(done){

    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Orders.logistic.js"],db,function(err){
        should.not.exist(err);

        //Orders.printInfo()
         // Orders.find({}).exec(function(e,os){
         //   os.forEach(function(o){o.print()})
         // })

        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  it('mark order shipped get an error when missing param',function(done){
    Orders.updateLogistic({oid:2100000}, {},function (err, orders) {
      should.exist(err)
      err.should.containEql('updateLogistic missing shipping param')
      done()
    })
  });

  it('mark order shipped get an error when missing param',function(done){
    Orders.updateLogistic({}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('updateLogistic missing order selector')
      done()
    })
  });


  it('mark order shipped get an error when payment is not auth',function(done){
    Orders.updateLogistic({oid:2000006}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('Impossible de livrer une commande sans validation financière')
      done()
    })
  });

  it('mark order shipped get an error when order is not fulfilled',function(done){
    Orders.updateLogistic({oid:2000016}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('Impossible de livrer une commande avec le status')
      done()
    })
  });

  it('mark order shipped get an error for wrong order id',function(done){
    Orders.updateLogistic({oid:3000020}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('Impossible de trouver la commande')
      done()
    })
  });

  it('mark order shipped true',function(done){
    Orders.updateLogistic({oid:2000007}, {status:true,bags:2},function (err, orders) {
      should.not.exist(err)
      should.exist(orders)
      orders[0].shipping.shipped.should.equal(true)
      orders[0].shipping.bags.should.equal(2)
      done()
    })
  });

  it('change order bags count',function(done){
    Orders.updateLogistic({oid:2000007}, {bags:1},function (err, orders) {
      should.not.exist(err)
      should.exist(orders)
      orders[0].shipping.shipped.should.equal(true)
      orders[0].shipping.bags.should.equal(1)
      done()
    })
  });


  it('mark order collected get an error when missing date',function(done){
    Orders.updateLogistic({'vendors.slug':'un-autre-shop'}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('updateLogistic missing date')
      done()
    })
  });

  it('mark order collected get an error if one order has issue',function(done){
    var when=Orders.findCurrentShippingDay();
    Orders.updateLogistic({'vendors.slug':'un-autre-shop'}, {status:true, when:when},function (err, orders) {
      should.exist(err)
      err.should.containEql('Impossible de livrer une commande')
      done()
    })
  });

  it.skip('mark order collect even when some orders are closed',function(done){
    Orders.updateLogistic({oid:2100000}, {status:true},function (err, orders) {
      should.exist(err)
      err.should.containEql('Impossible de livrer une commande fermée')
      done()
    })
  });

  it('mark order collected ',function(done){
    var when=Orders.findCurrentShippingDay();
    Orders.updateLogistic({'vendors.slug':'un-autre-shop-2'}, {status:true, when:when},function (err, orders) {
      should.not.exist(err)
      should.exist(orders)
      orders[0].vendors[0].collected.should.be.true
      orders[0].vendors[1].collected.should.be.false
      //orders[0].shipping.shipped.should.be.true
      done()
    })
  });

});

