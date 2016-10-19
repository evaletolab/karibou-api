// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.find.js"]);

var Products=db.model('Products')
  , Orders=db.model('Orders')
  , Shops=db.model('Shops')
  , today=new Date()
  , toshortDay
  , okDay
  , timeoutAndNotPaid=config.shared.order.timeoutAndNotPaid;





/**
 * create order successfuly :
 *  - avoid multiple user create order in the same time
 *  - update all product quantity
 *  - send email
 */

describe("orders.create.success.discount", function(){
  var _ = require("underscore");


  okDay=Orders.findNextShippingDay();
  toshortDay=Orders.findCurrentShippingDay();

  // select a shipping time
  okDay.setHours(11,0,0,0)

  function updateDiscount(urlpath, discount) {
    return Shops.findOneAndUpdate({urlpath:urlpath},{$set:{discount:discount}},{new:true});
  }


  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Orders.find.js"],db,function(err){
        should.not.exist(err);

        // Products.find({}).populate('vendor categories').exec(function(err,ps) {
        //   ps.forEach(function(p) {

        //     p.print();
        //   })
        // })
        // Orders.find({}).exec(function(e,os){
        //   os.forEach(function(o){
        //     o.print();
        //   })
        // })

        done();
      });
    });      
  });

  
  after(function(done){
    dbtools.clean(done);    
  });


  it("creating a new order without discount activated", function(done){

    var customer=data.Users[1];
    var shipping=customer.addresses[0];
    var payment={
      alias:((customer.id+"").hash().crypt()),
      issuer:"tester",
      number:'12xxxxxxx3456'
    };
    var items=[];
    items.push(Orders.prepare(data.Products[1], 3, ""))
    items.push(Orders.prepare(data.Products[2], 1, ""))
    items.push(Orders.prepare(data.Products[3], 3, ""))

    shipping.when=okDay
    shipping.hours=okDay.getHours();



    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      //console.log(order.items[0])
      should.not.exist(err)

      // checking item reservation
      order.vendors.forEach(function(o,i){
        o.discount.finalAmount.should.equal(0);
      })

      // check subtotal
      order.getTotalDiscount().should.equal(0);

      // check subtotal
      order.getSubTotal().should.equal(26.6)
      // check total with fees
      order.getTotalPrice().should.equal(37.35)


      done();                  
    });

  });

  it("creating a new order without engough for discount", function(done){
    // update shop for this test
    updateDiscount('mon-shop',{active:true,amount:1,threshold:11.41}).exec(function(err,s) {

      var customer=data.Users[1];
      var shipping=customer.addresses[0];
      var payment={
        alias:((customer.id+"").hash().crypt()),
        issuer:"tester",
        number:'12xxxxxxx3456'
      };
      var items=[];
      items.push(Orders.prepare(data.Products[1], 3, ""))
      items.push(Orders.prepare(data.Products[2], 1, ""))
      items.push(Orders.prepare(data.Products[3], 3, ""))

      shipping.when=okDay
      shipping.hours=okDay.getHours();



      //
      // starting process of order,
      //  - items, customer, shipping
      Orders.create(items, customer, shipping, payment, function(err,order){
        //console.log(order.items[0])
        should.not.exist(err)

        // checking item reservation
        _.findWhere(order.vendors,{slug:'mon-shop'})
            .discount.finalAmount.should.equal(0);

        // check subtotal
        order.getTotalDiscount().should.equal(0);

        // check subtotal
        order.getSubTotal().should.equal(26.6)
        // check total with fees
        order.getTotalPrice().should.equal(37.35)

        order.fulfillments.status="failure";
        order.payment.status='voided';
        order.rollbackProductQuantityAndClose('timeout',done);
      });
    });
  });

  it("creating a new order with discount for one shop", function(done){
    // update shop for this test
    updateDiscount('mon-shop',{active:true,amount:1,threshold:11.4}).exec(function(err,s) {

      var customer=data.Users[1];
      var shipping=customer.addresses[0];
      var payment={
        alias:((customer.id+"").hash().crypt()),
        issuer:"tester",
        number:'12xxxxxxx3456'
      };
      var items=[];
      items.push(Orders.prepare(data.Products[1], 3, ""))
      items.push(Orders.prepare(data.Products[2], 1, ""))
      items.push(Orders.prepare(data.Products[3], 3, ""))

      shipping.when=okDay
      shipping.hours=okDay.getHours();



      //
      // starting process of order,
      //  - items, customer, shipping
      Orders.create(items, customer, shipping, payment, function(err,order){
        //console.log(order.items[0])
        should.not.exist(err)

        // checking item reservation
        _.findWhere(order.vendors,{slug:'mon-shop'})
            .discount.finalAmount.should.equal(1);

        // check subtotal
        order.getTotalDiscount().should.equal(1);

        // check subtotal
        order.getSubTotal().should.equal(26.6)
        // check total with fees
        order.getTotalPrice().should.equal(36.3)

        order.fulfillments.status="failure";
        order.payment.status='voided';
        order.rollbackProductQuantityAndClose('timeout',done);
      });
    });
  });

  it("creating a new order with cumulated discount for one shop", function(done){
    // update shop for this test
    updateDiscount('mon-shop',{active:true,amount:1,threshold:11.40}).exec(function(err,s) {

      var customer=data.Users[1];
      var shipping=customer.addresses[0];
      var payment={
        alias:((customer.id+"").hash().crypt()),
        issuer:"tester",
        number:'12xxxxxxx3456'
      };
      var items=[];
      items.push(Orders.prepare(data.Products[1], 3, ""))
      items.push(Orders.prepare(data.Products[2], 1, ""))
      items.push(Orders.prepare(data.Products[3], 6, ""))

      shipping.when=okDay
      shipping.hours=okDay.getHours();

      //
      // starting process of order,
      //  - items, customer, shipping
      Orders.create(items, customer, shipping, payment, function(err,order){
        // console.log(err,order)
        should.not.exist(err)
        // checking item reservation
        _.findWhere(order.vendors,{slug:'mon-shop'})
            .discount.finalAmount.should.equal(2);

        // check subtotal
        order.getTotalDiscount().should.equal(2);

        // check subtotal
        order.getSubTotal().should.equal(38)
        // check total with fees
        order.getTotalPrice().should.equal(46.9)

        order.fulfillments.status="failure";
        order.payment.status='voided';
        order.rollbackProductQuantityAndClose('timeout',done);
      });
    });
  });

  it("creating a new order with cumulated discount for one shop", function(done){
    // update shop for this test
    updateDiscount('un-autre-shop',{active:true,amount:1.25,threshold:11.4}).exec(function(err,s) {

      var customer=data.Users[1];
      var shipping=customer.addresses[0];
      var payment={
        alias:((customer.id+"").hash().crypt()),
        issuer:"tester",
        number:'12xxxxxxx3456'
      };
      var items=[];
      items.push(Orders.prepare(data.Products[1], 3, ""))
      items.push(Orders.prepare(data.Products[2], 3, ""))
      items.push(Orders.prepare(data.Products[3], 6, ""))

      shipping.when=okDay
      shipping.hours=okDay.getHours();

      //
      // starting process of order,
      //  - items, customer, shipping
      Orders.create(items, customer, shipping, payment, function(err,order){
        // console.log(err,order)
        should.not.exist(err)
        // checking item reservation
        _.findWhere(order.vendors,{slug:'mon-shop'})
            .discount.finalAmount.should.equal(2);

        _.findWhere(order.vendors,{slug:'un-autre-shop'})
            .discount.finalAmount.should.equal(2.5);

        // check subtotal
        order.getTotalDiscount().should.equal(4.5);


        order.fulfillments.status="failure";
        order.payment.status='voided';
        order.rollbackProductQuantityAndClose('timeout',done);
      });
    });
  });

});

