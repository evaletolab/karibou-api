var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var payment = require('../app/payment');
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("api.orders.payment.capture", function(){
  var request= require('supertest');
  var _ = require("underscore");
  var admins=config.admin.emails;



  var nextShippingDay=Orders.findCurrentShippingDay();
  var okDay=Orders.findNextShippingDay();


  before(function(done){
    // remove admin account
    // config.admin.emails=[]
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.payment.capture.js"],db,function(err){
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
  it('POST /v1/orders/2000003/capture 401 for anonymous',function(done){

    request(app)
      .post('/v1/orders/2000003/capture')
      .send({reason:'yo'})
      .expect(401,done);

  });  

  it('POST /v1/orders/2000003/capture 401 for non owner',function(done){
    request(app)
      .post('/v1/orders/2000003/capture')
      .send({reason:'yo'})
      .set('cookie', gluck)
      .end(function(err,res){
        res.should.have.status(401);
        res.text.should.containEql('est réservée a un administrateur')
        done();
      });
  });  


  it('POST /v1/orders/2000008/capture 400 when payment method is not valid',function(done){
    request(app)
      .post('/v1/orders/2000008/capture')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql("La référence de la carte n'est pas compatible avec le service de paiement")
        done();
      });
  });  

  it('POST /v1/orders/2000009/capture 400 when status!=fulfilled',function(done){
    request(app)
      .post('/v1/orders/2000009/capture')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql('avec le status: partial')
        done();
      });
  });  

  it('POST /v1/orders/2000010/capture 400 when payment!=authorized',function(done){
    request(app)
      .post('/v1/orders/2000010/capture')
      .send({reason:'customer'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql('avec le status: pending')
        done();
      });
  });  


  it('POST /v1/orders/2000007/capture 200  test method',function(done){
    request(app)
      .post('/v1/orders/2000007/capture')
      .set('cookie', cookie)
      .end(function(err,res){
        Orders.findOne({oid:2000007},function (err,order) {

          //
          // 1000004 => failure (2.5)
          // 1000002 => 9
          // 1000003 => 15.2
          // verify sub total = 24.2 vs. 26.7


          res.should.have.status(200);
          should.exist(order.oid)
          res.body.payment.status.should.equal('paid');

          // not needed here...
          parseFloat(res.body.mail.subTotal).should.equal(order.getSubTotal())          
          parseFloat(res.body.mail.totalWithFees).should.equal(order.getTotalPrice())
          done();
        })
      });
  });  

  it('POST /v1/orders/2000006/capture 200  got invoice status',function(done){
    request(app)
      .post('/v1/orders/2000006/capture')
      .set('cookie', cookie)
      .end(function(err,res){
        Orders.findOne({oid:2000006},function (err,order) {
          res.should.have.status(200);
          should.exist(order.oid)
          res.body.payment.status.should.equal('invoice');

          // not needed here...
          parseFloat(res.body.mail.subTotal).should.equal(order.getSubTotal())          
          parseFloat(res.body.mail.totalWithFees).should.equal(order.getTotalPrice())
          done();
        })
      });
  });  

  it('POST /v1/orders/2000006/capture 200  new invoice status',function(done){
    request(app)
      .post('/v1/orders/2000006/capture')
      .send({reason:'invoice'})
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        should.exist(res.body.oid)
        res.body.payment.status.should.equal('invoice');
        res.body.payment.logs.length.should.equal(2);
        res.body.payment.logs[1].should.containEql('invoice 34.2 the')
        done();
      });
  });  


  it.skip("POST /v1/orders create 2 orders with open invoice return 400", function(done){
    var templateOrder=data.Orders[2];
    templateOrder.customer.id='12346'
    var payment={
          alias:((templateOrder.customer.id+"invoice").hash().crypt()),
          issuer:"invoice",
          expiry:'12/'+okDay.getFullYear()
        };

    var order={
      customer:templateOrder.customer,
      items:[templateOrder.items[0]],
      shipping:templateOrder.shipping,
      payment:payment
    }
    order.items.forEach(function (item) {
      item.categories=item.category;
      item.price=3.8;
      item.finalprice=item.price*item.quantity;
    })
    okDay.setHours(11,0,0,0)
    order.shipping.when=okDay;



    // done()
    request(app)
      .post('/v1/orders')
      .send(order)
      .set('cookie', cookie)
      .expect(400,function(err,res){
        should.not.exist(err)
        res.text.should.containEql("Le paiement par facture n'est plus disponible")
        done()
      });
  }); 

  it('POST /v1/orders/2000006/capture 200  got paid status',function(done){
    request(app)
      .post('/v1/orders/2000006/capture')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(200);
        should.exist(res.body.oid)
        res.body.payment.status.should.equal('paid');

        done();
      });
  });  


  it('POST /v1/orders/2000006/capture 400  when status is already paid ',function(done){
    request(app)
      .post('/v1/orders/2000006/capture')
      .set('cookie', cookie)
      .end(function(err,res){
        res.should.have.status(400);
        res.text.should.containEql('avec le status: paid')
        done();
      });
  });  

});

