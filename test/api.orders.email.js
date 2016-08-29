var app = require("../app");


var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");require("should-http");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("api.orders.email", function(){
  var request= require('supertest');
  var _ = require("underscore");
  var oneweek=Orders.findOneWeekOfShippingDay();
  var nextWeekDay=oneweek[oneweek.length-1]
  var currentShippingDay=Orders.findCurrentShippingDay();
  var sellerDay=Orders.findCurrentShippingDay();

  var admins=[]





  before(function(done){
    // remove admin
    admins=config.admin.emails;config.admin.emails=[];
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
        should.not.exist(err);

        // Orders.printInfo()
        //  Orders.find({}).exec(function(e,os){
        //    os.forEach(function(o){o.print()})
        //  })

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
  var cookie;

  it("login",function(done){
    request(app)
      .post('/login')
      .send({ email: "evaleto@gmail.com", password:'password',provider:'local' })
      .end(function(e,res){
        should.not.exist(e)
        cookie = res.headers['set-cookie'];
        done()
      });
  })

  it('POST /v1/orders/un-autre-shop/email  send email return 401 when anonymous',function(done){
    request(app)
      .post('/v1/orders/un-autre-shop/email')
      .send({when:sellerDay})
      .expect(401,function(err,res){
        should.not.exist(err)
        //res.body.length.should.equal(3)
        done()
      });  
  });  

  it('POST /v1/orders/un-autre-shop/email  send email return 401 when not shop owner',function(done){
    request(app)
      .post('/v1/orders/un-shop/email')
      .send({when:sellerDay})
      .set('cookie', cookie)      
      .expect(401,function(err,res){
        should.not.exist(err)
        res.text.should.containEql('Your are not the owner of this shop')
        //res.body.length.should.equal(3)
        done()
      });  
  });  


  it('POST /v1/orders/super-shop/email  send email return 200 and empty {} for wrong date',function(done){

    request(app)
      .post('/v1/orders/super-shop/email')
      .send({when:nextWeekDay})
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        should.not.exist(err)
        Object.keys(res.body).length.should.equal(0)
        done()
      });  
  });  

  it('POST /v1/orders/super-shop/email  send email return 200',function(done){
    request(app)
      .post('/v1/orders/super-shop/email')
      .send({when:sellerDay})
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        var when=Orders.formatDate(sellerDay)
        should.not.exist(err)
        should.exist(res.body['super-shop'].items)
        res.body['super-shop'].items[0].sku.should.equal(1000001)
        res.body['super-shop'].items[0].vendor.should.equal('super-shop')
        res.body['super-shop'].shippingWhen.should.equal(when)
        // res.body.oid.should.equal(2000008)
        //res.body.length.should.equal(3)
        done()
      });  
  });  

  it('POST /v1/orders/shops/email to all shops  send email return 200',function(done){
    request(app)
      .post('/v1/orders/shops/email')
      .send({when:sellerDay})
      .set('cookie', cookie)      
      .expect(200,function(err,res){
        var when=Orders.formatDate(sellerDay)
        should.not.exist(err)

        should.exist(res.body['super-shop'].items)
        should.exist(res.body['un-autre-shop'].items)
        res.body['super-shop'].items[0].sku.should.equal(1000001);
        res.body['super-shop'].shippingWhen.should.equal(when)

        // 
        // all items should belongs to the same shop
        res.body['super-shop'].items.forEach(function (item) {
          item.vendor.should.equal('super-shop');
        })
        res.body['un-autre-shop'].items.forEach(function (item) {
          item.vendor.should.equal('un-autre-shop');
        });

        // 
        // for one shop, all items == all products
        res.body['un-autre-shop'].products.forEach(function(item) {
          should.exist(_.find(res.body['un-autre-shop'].items, {sku:item.sku}));
        })
        res.body['super-shop'].products.forEach(function(item) {
          should.exist(_.find(res.body['super-shop'].items, {sku:item.sku}));
        })




        var count2000006=0;
        res.body['un-autre-shop'].items.map(function (i) {
          if(i.oid===2000006)count2000006++;
          return i.oid;
        }).should.containEql(2000006);
        count2000006.should.equal(2);
        done()
      });  
  });  



});

