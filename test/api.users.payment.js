// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("api.users.payment", function(){
  var request= require('supertest');

  var _=require('underscore');

  var cookie, user;


  var MasterCard = {
    number: '5399999999999999', // MasterCard
    csc: '111',
    year: '2020',
    month: '09',
    firstName: 'Foo',
    lastName: 'Bar',
    address1: '221 Foo st',
    address2: '', // blank
    city: '', // blank
    state: '', // blank
    zip: '1208'
  };

  var VisaCard = {
    number: '4111-1111-1111-1111',
    csc: '123',
    year: '2020',
    month: '09',
    firstName: 'Foo',
    lastName: 'Bar'
  };


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
      .send({alias:'1234567890',expiry:'0915',name:'TO OLI',type:'MC'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user add new payment without name return 400',function(done){
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send({alias:'1234567890',expiry:'0915',number:'TO OLI',type:'MC'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });


  it('user add new payment return 200',function(done){
    var payment={number:'1234567890',expiry:'0915',name:'TO OLI',type:'MC'};
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
    var payment={number:'1234567890',expiry:'0916',name:'TO OLI',type:'MC'};
    var alias=(user.id+payment.type).hash().crypt();
    payment.alias=alias;
    request(app)
      .post('/v1/users/'+user.id+'/payment')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });


  it('user update payment number return 200',function(done){
    var payment={number:'1234567890',expiry:'0916',name:'TO OLI',type:'MC'};
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
    var payment={alias:'pipo',number:'1234567890',expiry:'0916',name:'TO OLI',type:'MC'};
    request(app)
      .post('/v1/users/'+user.id+'/payment/pipo2/update')
      .send(payment)
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        done()
      });
  });

  it('user remove alias payment return 200',function(done){
    var payment={number:'1234567890',expiry:'0916',name:'TO OLI',type:'MC'};
    var alias=(user.id+payment.type).hash();
    request(app)
      .post('/v1/users/'+user.id+'/payment/'+alias+'/delete')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        done()
      });
  });

  it('user add new payment (crypt) return 200',function(done){
    var payment={number:'1234567890',expiry:'0915',name:'TO OLI',type:'MC'};
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
    var payment={number:'1234567890',expiry:'0916',name:'TO OLI',type:'MC'};
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

