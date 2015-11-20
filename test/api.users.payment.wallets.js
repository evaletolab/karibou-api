// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js",'Products.js']);

// 12345 ==> evaleto@gluck.com 
// 12346 ==> evaleto@gmail.com (ADMIN)
// 12347 ==> delphine@gmail.com


// 12345 ==> Test product bio 1
// 12346 ==> Test product 2
// 12347 ==> Test product bio 3

describe("api.wallets", function(){
  var request= require('supertest');

  var _=require('underscore');
  

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.js","../fixtures/Documents.js"],db,function(err){
        console.log(err)
        should.not.exist(err);
        done()
      });
    });      
  });

  after(function(done){
    dbtools.clean(function(){    
      done();
    });    
  });

  //
  // basics rights
  it('GET /v1/wallets should return 401',function(done){
    request(app)
      .get('/v1/wallets')
      .expect(401,done);
  });

  it('GET /v1/wallets/012345 should return 401',function(done){
    request(app)
      .get('/v1/wallets/012345')
      .expect(401,done);
  });

  it('POST /v1/wallets should return 401',function(done){
    request(app)
      .post('/v1/wallets')
      .expect(401,done);
  });

  it('POST /v1/wallets should return 401 for anonymous',function(done){
    request(app)
      .post('/v1/wallets')
      .send({})
      .expect(401,done);
  });

  it('POST /v1/wallets/012345 should return 401 for anonymous',function(done){
    request(app)
      .post('/v1/wallets/012345')
      .send({})
      .expect(401,done);
  });
  
  it('POST /v1/wallets/register/012345 should return 401 for anonymous',function(done){
    request(app)
      .post('/v1/wallets/register/012345')
      .send({})
      .expect(401,done);
  });

  describe("authentication ", function(){
    var giftWallet={};
    var admin, delphine={}, gluck;

    it("user admin",function (done) {
      request(app)
        .post('/login')
        .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          //res.headers.location.should.equal('/');
          res.body.email.address.should.equal("evaleto@gmail.com");
          admin=res.body;
          admin.cookie = res.headers['set-cookie'];
          should.exist(admin);
          done();        
      });
    })

    it("user non admin delphine", function(done){
      request(app)
        .post('/login')
        .send({ email: "delphine@gmail.com", password:'password',provider:'local' })
        .end(function(err,res){
          res.should.have.status(200);
          _.extend(delphine,res.body);
          delphine.cookie = res.headers['set-cookie'];
          should.exist(delphine);
          done();        
      });
    });  

    it('GET /v1/wallets for non admin should return 200',function(done){
      request(app)
        .get('/v1/wallets')
        .set('cookie', delphine.cookie)
        .expect(200,done);
    });

    it('GET /v1/wallets for admin should return 200',function(done){
      request(app)
        .get('/v1/wallets')
        .set('cookie', admin.cookie)
        .end(function (err,res) {
          res.should.have.status(200);
          res.body.length.should.equal(0);
          done()
        });
    });

    it('GET /v1/wallets/012345 should return 401',function(done){
      request(app)
        .get('/v1/wallets/012345')
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          res.should.have.status(401);
          res.text.should.containEql('Cette fonctionalité est réservée a un administrateur');
          done()
        });
    });

    it('POST /v1/wallets missing alias should return 400',function(done){
      var payment={
        number:"xxxx-xxxx-xxxx-4444", expiry:"12/2029",name:'TO OLI',issuer:'tester'
      }, amount=0;
      request(app)
        .post('/v1/wallets')
        .send({amount:amount,payment:payment})
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          res.should.have.status(400);
          res.text.should.containEql('Ce mode de paiement n\'est pas valide');
          done()
        });
    });
   
    it('POST /v1/wallets missing payment should return 400',function(done){
      var payment={
        number:"xxxx-xxxx-xxxx-4444", expiry:"12/2029",name:'TO OLI',issuer:'tester',
        alias:(delphine.id+'').hash().crypt()
      },amount=0;
      request(app)
        .post('/v1/wallets')
        .send({amount:amount})
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          res.should.have.status(400);
          res.text.should.containEql('Les données du mode de paiement doivent être définis');
          done()
        });
    });
   
    it('POST /v1/wallets missing amount should return 400',function(done){
      var payment={
        number:"xxxx-xxxx-xxxx-4444", expiry:"12/2029",name:'TO OLI',issuer:'tester',
        alias:(delphine.id+'').hash().crypt()
      },amount=0;
      request(app)
        .post('/v1/wallets')
        .send({payment:payment})
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          res.should.have.status(400);
          res.text.should.containEql('La valeur du montant n\'est pas valide');
          done()
        });
    });

    it('POST /v1/wallets delphine create 10fr giftcard return 200',function(done){
      var payment={
        number:"xxxx-xxxx-xxxx-4444", expiry:"12/2029",name:'TO OLI',issuer:'tester',
        alias:(delphine.id+'').hash().crypt()
      },amount=10;
      request(app)
        .post('/v1/wallets')
        .send({payment:payment,amount:amount})
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          _.extend(giftWallet,res.body);
          res.should.have.status(200);
          res.body.balance.should.equal(1000);
          done()
        });
    });


    it('POST /v1/wallets register not owner of wallet (admin!=delphine) return 401',function(done){

      var card={
        number:giftWallet.card.number,
        name:'O. Test'
      },amount=10, alias=(admin.id+':1520:wa_1234567891').crypt();
      request(app)
        .post('/v1/wallets/register/'+alias)
        .send(card)
        .set('cookie', delphine.cookie)
        .end(function (err,res) {
          res.should.have.status(401);
          done()
        });
    });
   
    it.skip('POST /v1/wallets register created giftcard return 200',function(done){

      var card={
        number:giftWallet.card.number,
        name:'O. Test'
      },amount=10, alias=(admin.id+':1520:wa_1234567891').crypt();
      request(app)
        .post('/v1/wallets/register/'+alias)
        .send(card)
        .set('cookie', admin.cookie)
        .end(function (err,res) {
          console.log('---------',err,res.text)
          res.should.have.status(200);
          done()
        });
    });
   

    
  });
      
  
    

  
});

