// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js"]);

//http://www.paypalobjects.com/en_US/vhelp/paypalmanager_help/credit_card_numbers.htm
describe("api.users.payment", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie, user;

  var pspWebhook={ 
    orderID: 'AS1423152577442',
    currency: 'CHF',
    amount: '1',
    PM: 'PostFinance Card',
    ACCEPTANCE: 'test123',
    STATUS: '5',
    CARDNO: '**-XXXX-81',
    ALIAS: '2091529620513003',
    ED: '0719',
    CN: 'test1 test1',
    TRXDATE: '02/05/15',
    PAYID: '39152967',
    NCERROR: '0',
    BRAND: 'PostFinance Card',
    IPCTY: 'CH',
    CCCTY: '99',
    ECI: '7',
    CVCCheck: 'NO',
    AAVCheck: 'NO',
    VC: '',
    AAVADDRESS: 'NO',
    AAVNAME: 'NO',
    AAVMAIL: 'NO',
    IP: '84.227.169.49',
    createAlias: 'true',
    user: '1279482741765243',
    SHASIGN: '5FF339B3F8EEFBB976C0249BD74FD156287BDA3D5A5E99FC1858EB880B1051EE' 
  }

  //378282246310005


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });
  });


  after(function(done){
    dbtools.clean(function(){
      done();
    });
  });






  it('PSP webhook create payment for postfinance card',function(done){
    request(app)
      .post('/v1/psp/qawsedr/webhook')
      .send(pspWebhook)
      .end(function(err,res){
        res.should.have.status(200);
        db.model('Users').findOne({id: pspWebhook.user}, function(err,user){
          user.payments[0].alias.should.equal(pspWebhook.ALIAS.crypt())
          user.payments[0].type.should.equal(pspWebhook.BRAND.toLowerCase())
          user.payments[0].name.should.equal(pspWebhook.CN)
          user.payments[0].number.should.equal(pspWebhook.CARDNO)
          user.payments[0].expiry.should.equal(pspWebhook.ED)
          done()
        })
      });
  });

  it('second PSP webhook got error payment already exist',function(done){
    request(app)
      .post('/v1/psp/qawsedr/webhook')
      .send(pspWebhook)
      .end(function(err,res){
        res.should.have.status(200);
        db.model('Users').findOne({id: pspWebhook.user}, function(err,user){
          user.payments.length.should.equal(1)
          done()
        });
      });
  });

});
