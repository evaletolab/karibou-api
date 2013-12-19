// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Products.more.js","Shops.js"]);

var Products=db.model('Products'), 
    Orders=db.model('Orders');

describe("orders.create", function(){
  var _ = require("underscore");

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.js","../fixtures/Categories.js","../fixtures/Shops.js","../fixtures/Products.more.js"],db,function(err){
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

  




  it("Error on creation of a new order without items", function(done){
   var items=[]
      , customer=data.Users[0]
      , shipping={
          when:Date.now()
        }
      , payment="postfinance";


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
      , payment="postfinance";


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
      , payment="postfinance";


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
            location: "Genève-Ville",
            postalCode: "1208",
            primary: true,
            region: "GE",
            when:Date.now()
        }
        , payment="postfinance";


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
      //console.log(err)
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
            location: "Genève-Ville",
            postalCode: "1208",
            geo: {
                lat: 46.1997473,
                lng: 6.1692497
            },
            primary: true,
            region: "GE",
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

 it("Error on creation of an order with a bad gateway", function(done){
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
            when:Date.now()
        }
      , payment="pooet";


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

  it("Checking status after creating a new order ", function(done){
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
            when:Date.now()
        }
      , payment="postfinance";


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
      //console.log(err)
      should.not.exist(err)
      done();          
    });
  });     
});

