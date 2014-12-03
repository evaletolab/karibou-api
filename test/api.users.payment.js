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
    number: '5399999999999999', // MasterCard
    csc: '111',
    year: '2020',
    month: '09'
  };

  var VisaCard = {
    number: '4111-1111-1111-1111',
    csc: '123',
    year: '2020',
    month: '09'
  };

  var AmericanExpressCard = {
    number: '371449635398431',
    csc: '1234',
    year: '2020',
    month: '09'
  };

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

  it('user remove unknow payment return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment/pipo/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });



  it('user add new payment without number return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({alias:'1234567890',expiry:'0915',name:'TO OLI',type:'mastercard'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user add new payment without name return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({alias:'1234567890',expiry:'0915',number:'TO OLI',type:'mastercard'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user add new payment without CSC return 400',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI'};
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });


  it('user add new payment return 200',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc,type:'visa'};
    var alias=(user.id+payment.type).hash();
    payment.alias=alias;
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
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc};
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });


  it('user update card from visa to MasterCard return 400',function(done){
    var payment={number:MasterCard.number,expiry:'0921',name:'TO OLI',csc:MasterCard.csc,type:'visa'};
    var alias=(user.id+payment.type).hash().crypt();
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



  it('user update payment number return 200',function(done){
    var payment={number:VisaCard.number,expiry:'0922',name:'TO OLI',csc:VisaCard.csc,type:'visa'};
    var alias=(user.id+payment.type).hash().crypt();
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


  it('user update unknow alias return 400',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc,type:'mastercard'};
    request(app)
      .post('/v1/users/'+user.id+'/payment/pipo2/update')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user remove uncrypted alias payment return 400',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc,type:'visa'};
    var alias=(user.id+payment.type).hash();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include("Impossible de reconnaitre l'alias de votre méthode")
        done()
      });
  });

  it('user remove alias payment return 200',function(done){
    var payment={number:VisaCard.number,expiry:'0920',name:'TO OLI',csc:VisaCard.csc,type:'visa'};
    var alias=(user.id+payment.type).hash().crypt();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });


  it('user add new payment (crypt) return 200',function(done){
    var payment={number:MasterCard.number,expiry:'0921',name:'TO OLI',csc:MasterCard.csc,type:'mastercard'};
    var alias=(user.id+payment.type).hash().crypt();
    payment.alias=alias;
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
    var payment={number:MasterCard.number,expiry:'0921',name:'TO OLI',csc:MasterCard.csc,type:'mastercard'};
    var alias=(user.id+payment.type).hash().crypt();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });
});
