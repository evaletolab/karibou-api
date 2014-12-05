var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("api.orders.payment", function(){
  var request= require('supertest');
  var _ = require("underscore");
  var admins=config.admin.emails;



  var nextShippingDay=Orders.findCurrentShippingDay();


  before(function(done){
    // remove admin account
    config.admin.emails=[]
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.payment.js"],db,function(err){
        should.not.exist(err);

        //Orders.printInfo()
         Orders.find({}).exec(function(e,os){
           //os.forEach(function(o){o.print()})
         })

        done();
      });
    });      
  });

  
  after(function(done){
    config.admin.emails=admins;
    dbtools.clean(function(){    
      done();
    });    
  });

  //
  // keep session
  var cookie, gluck;

  it("login evaleto",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
      .end(function(e,res){
        cookie = res.headers['set-cookie'];
        done()
      });
  })

  it("login gluck",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gluck.com", password:'password',provider:'local' })
      .end(function(e,res){
        gluck = res.headers['set-cookie'];
        done()
      });
  })



  //
  // CANCEL
  //
  it('POST /v1/orders/2000003/cancel 401 for anonymous',function(done){

    request(app)
      .post('/v1/orders/2000003/cancel')
      .send({reason:'yo'})
      .expect(401,done);

  });  

  it('POST /v1/orders/2000003/cancel 401 for non owner',function(done){
    request(app)
      .post('/v1/orders/2000003/cancel')
      .send({reason:'yo'})
      .set('cookie', gluck)
      .end(function(err,res){
        res.should.have.status(401);
        res.text.should.include('not the owner')
        done();
      });
  });  

  it('POST /v1/orders/2000003/cancel 401 for non owner',function(done){
    request(app)
      .post('/v1/orders/2000003/cancel')
      .send({reason:'yo'})
      .set('cookie', gluck)
      .end(function(err,res){
        res.should.have.status(401);
        res.text.should.include('not the owner')
        done();
      });
  });  

  it('POST /v1/orders/2000009/cancel 400 when status!=reserved',function(done){
    request(app)
      .post('/v1/orders/2000009/cancel')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include('avec le status: partial')
        done();
      });
  });  

  it('POST /v1/orders/2000010/cancel 400 when payment!=authorized',function(done){
    request(app)
      .post('/v1/orders/2000010/cancel')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include('avec le status: pending')
        done();
      });
  });  

  it('POST /v1/orders/2000008/cancel 400 when payment method is not valid',function(done){
    request(app)
      .post('/v1/orders/2000008/cancel')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.include('méthode de paiement est invalide')
        done();
      });
  });  

  it('POST /v1/orders/2000007/cancel 200 ',function(done){
    request(app)
      .post('/v1/orders/2000007/cancel')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.fulfillments.status.should.equal('failure')
        res.body.payment.status.should.equal('voided')
        res.body.cancel.reason.should.equal('customer')
        done();
      });
  });  

  it('GET /v1/orders/2000007 return status 200 ',function(done){
    request(app)
      .get('/v1/orders/2000007')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        res.body.fulfillments.status.should.equal('failure')
        res.body.payment.status.should.equal('voided')
        res.body.cancel.reason.should.equal('customer')
        done();
      });
  });  

});

