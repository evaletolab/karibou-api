// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);

//http://www.paypalobjects.com/en_US/vhelp/paypalmanager_help/credit_card_numbers.htm
describe("api.users.payment", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie, user;


  var MasterCard = {
    number: '5399 9999 9999 9999', // MasterCard
    hiddenNumber:'xxxx-xxxx-xxxx-9999',
    name:'Foo BAR',
    csc: '111',
    year: '2020',
    month: '09',
    issuer:'tester'
  };

  var VisaCard = {
    number: '4111-1111-1111-1111',
    hiddenNumber:'xxxx-xxxx-xxxx-1111',
    name:'Foo BAR',
    csc: '123',
    year: '2020',
    month: '09',
    issuer:'tester'
  };

  var AmericanExpressCard = {
    number: '371449635398431',
    hiddenNumber: 'xxxx-xxxx-xxxx-8431',
    name:'Foo BAR',
    csc: '1234',
    year: '2020',
    month: '09',
    issuer:'tester'
  };

  function cardDate (card) {
    return card.month+'/'+card.year
  }
  //{"alias":"9537c12015ff39bd3a5d5ff6649ba31db9e8324a49c5a6624e005d2d4a7e997af55babf3253e90a17055d05fd779f531937907b07f0f5f11ec9e367000e997d4008749a38e1ddfd1c7d62e3cb7ab0eb80e0e0e0e","issuer":"visa","name":"olivier oli","number":"xxxx-xxxx-xxxx-1881","expiry":"2/2017","updated":1424359153343}


  //378282246310005


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js",
                    "../fixtures/Categories.js",
                    "../fixtures/Shops.js",
                    "../fixtures/Products.js"
      ],db,function(err){
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




  it('POST /login should return 200 ',function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password', provider:'local' })
      .end(function(err,res){
        res.should.have.status(200);
        res.body.roles.should.not.include('admin');
        cookie = res.headers['set-cookie'];
        user=res.body;
        done();
      });
  });


  it('GET /v1/users/me should return 200',function(done){
    request(app)
      .get('/v1/users/me')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.id.should.equal(user.id)
        done()
      });

  });

  it('user remove 2short alias payment return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment/pipo/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.include("mode de paiement est inconnu")
        res.should.have.status(400);
        done()
      });
  });


  it('user add new payment without ID return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({expiry:cardDate(VisaCard),name:VisaCard.name,number:VisaCard.hiddenNumber,issuer:'visa'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.include("Impossible d'enregistrer une carte sans (id:stripe)")
        res.should.have.status(400);
        done()
      });
  });

  it('user add new payment without name return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({expiry:cardDate(VisaCard),number:VisaCard.hiddenNumber,issuer:'tester'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.include('Le titulaire de la carte ')
        res.should.have.status(400);
        done()
      });
  });



  it('user add new payment without expiry return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({name:VisaCard.name,number:VisaCard.hiddenNumber,issuer:'tester'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.include('La date de validité')
        res.should.have.status(400);
        done()
      });
  });

  //
  // issuer is computed with the number 
  it('user add new payment without issuer return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({expiry:cardDate(VisaCard),name:VisaCard.name,number:VisaCard.hiddenNumber})
      .set('cookie', cookie)
      .end(function(err,res){
        res.text.should.include("Le type de carte n'est pas valide")
        res.should.have.status(400);
        done()
      });
  });



  it('user add new payment return 200',function(done){
    var payment={
      expiry:cardDate(VisaCard),
      issuer:'tester',
      name:VisaCard.name
    };
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });


  it('user add duplicate payment return 400',function(done){
    var payment={
      expiry:cardDate(VisaCard),
      issuer:'tester',
      name:VisaCard.name
    };
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include('méthode de paiement existe')
        done()
      });
  });


  it.skip('user update card from visa to MasterCard return 400',function(done){
    var payment={number:MasterCard.number,expiry:'0921',name:'TO OLI',csc:MasterCard.csc,issuer:'visa'};
    var alias=(user.id).hash().crypt();
    payment.alias=alias;
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/update')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });



  it.skip('user update payment number return 200',function(done){
    var payment={number:VisaCard.number,expiry:'0922',name:'TO OLI',csc:VisaCard.csc,issuer:'visa'};
    var alias=(user.id).hash().crypt();
    payment.alias=alias;
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/update')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });


  it.skip('user update unknow alias return 400',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc,issuer:'mastercard'};
    request(app)
      .post('/v1/users/'+user.id+'/payment/pipo2/update')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user remove unknown alias payment return 400',function(done){
    var alias=(user+'').hash();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include("Ce mode de paiement est inconnu")
        done()
      });
  });

  it('user remove alias payment return 200',function(done){
    var payment={
      expiry:cardDate(VisaCard),
      issuer:'tester',
      name:VisaCard.name
    };
    var alias=(user.id+'').hash().crypt();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });


  it('user add new payment (crypt) return 200',function(done){
    var payment={
      expiry:cardDate(VisaCard),
      issuer:'tester',
      name:VisaCard.name
    };
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });



  it('user remove alias payment (crypt) return 200',function(done){
    var alias=(user.id+'').hash().crypt();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });
});
