// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Orders.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("orders.create", function(){
  var _ = require("underscore");
  var items=[]
    , customer=data.Users[1]
    , shipping={
          name: "famille olivier evalet",
          note: "123456",
          streetAdress: "route de chêne 34",
          floor: "2",
          location: "Genève-Ville",
          postalCode: "1208",
          geo: {
              lat: 46.1997473,
              lng: 6.1692497
          },
          primary: true,
          region: "GE",
          when:Orders.jumpToNextWeekDay(new Date(),config.shared.order.weekdays[0])
      }
    , payment={alias:((customer.id+'').hash().crypt()),issuer:"tester",number:'12xxxxxxxxx3456'},
    okDay,
    toshortDay,
    okDayBadTime,
    weekdays;

  before(function(done){

    // init dates
    //config.shared.order.weekdays=[0,1,2,3,4,5,6]
    weekdays=config.shared.order.weekdays;
    okDay=Orders.findNextShippingDay();
    toshortDay=Orders.findCurrentShippingDay();
    okDayBadTime=new Date(okDay)

    // select a shipping time
    okDay.setHours(11,0,0,0)
    okDayBadTime.setHours(14,0,0,0)

    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Products.js","../fixtures/Shops.js"],db,function(err){
        should.not.exist(err);
        done();
      });
    });      
  });

  
  after(function(done){
    config.shared.order.weekdays=weekdays;
    dbtools.clean(function(){    
      done();
    });    
  });

  




  it("Error on creation of a new order without items", function(done){
   var items=[]
      , customer=data.Users[0]
      , shipping={
          when:new Date()
        }
      , payment="tester";


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });  
  });

  it("Error on creation of an order without customer", function(done){
    var items=[]
      , customer={}
      , shipping={
          when:Date.now()
        }
      , payment="tester";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });  

 it("Error on creation of an order without valid email", function(done){
    var items=[]
      , customer=data.Users[0]
      , shipping={
          when:Date.now()
        }
      , payment="tester";


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });  

  it("Error on creation of an order without shipping geo", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            primary: true,
            region: "Genève",
            when:Date.now()
        }
        , payment="tester";




    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      // console.log(err)
      should.exist(err)
      done();          
    });
  });  

  it("Error on creation of an order without gateway", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:Date.now()
        }
      , payment;


    data.Products.forEach(function(product){
      //
      // prepare is a private helper function for testing purpose
      var e=Orders.prepare(product, 3, "");
      items.push(e)
    });


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      done();          
    });
  });    

 it("Error on creation of an order with a bad payment", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:okDay
        }
      , payment="pooet";



    items.push(Orders.prepare(data.Products[0], 2, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("Could not find payment method")
      done();          
    });
  });    

 it("Error on creation of an order with a bad payment.alias", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:okDay
        }
      , payment={alias:'122',issuer:'tester',number:'123'};



    items.push(Orders.prepare(data.Products[0], 2, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("Votre méthode de paiement est invalide")
      done();          
    });
  });    

 it("Error on creation of an order with a wrong payment.issuer", function(done){
    var items=[]
      , customer=data.Users[1]
      , shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:okDay
        }
      , payment={alias:'122',issuer:'test',number:'123'};



    items.push(Orders.prepare(data.Products[0], 2, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("Could not find payment method")
      done();          
    });
  });    

  it("Error:selected shipping date (eg. sunday) is not a shippable day", function(done){

    shipping.when=Orders.jumpToNextWeekDay(new Date(),0) // sunday is noz
    shipping.when.setHours(11,0,0,0);

    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))

    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("La date de livraison n'est pas valable")

      done();          
    });
  });    

  it("Error:selected shipping day is to short to prepare an order (date < config.shared.order.timelimit)", function(done){
    shipping.when=toshortDay;
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("Cette date de livraison n'est plus")

      done();          
    });
  });  

  it("Error:selected shipping time  is not availabe", function(done){

    shipping.when=okDayBadTime
    items=[]
    items.push(Orders.prepare(data.Products[0], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql("L'heure de livraison n'est pas valable")

      done();          
    });
  });  

  it("Error:selected products are not in the database", function(done){
    shipping.when=okDay
    items=[]
    items.push(Orders.prepare(data.Products[2], 1, ""))


    //
    // starting process of order,
    //  - items, customer, shipping
    Orders.create(items, customer, shipping, payment, function(err,order){
      should.exist(err)
      err.should.containEql(" produits sélectionnés n'existent plus")

      done();          
    });
  });  

  it("Error:selected products doesn't contains this variant", function(done){
    shipping={
            name: "famille olivier evalet",
            note: "123456",
            streetAdress: "route de chêne 34",
            floor: "2",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "Genève",
            when:okDay
        };
    items=[]


    Products.findOne({sku:12346}).populate('categories').populate('vendor').exec(function (e,product) {
      items.push(Orders.prepare(product, 1, ""))
      items[0].variant={title:'Super ce variant'}

      //
      // starting process of order,
      //  - items, customer, shipping
      Orders.create(items, customer, shipping, payment, function(err,order){
        should.exist(order.errors)
        order.errors[0]['12346'].should.containEql("variation de ce produit n'est")

        done();          
      });

    })

  });  

});

