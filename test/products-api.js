// Use a different DB for tests
var app = require("../app/index");


// why not using
// https://github.com/1602/jugglingdb




describe("Products API", function(){
  var profile = null;
  var assert = require("assert");
  var request= require('supertest');

 var p={
     title: "Pâtes complètes à l'épeautre ''bio reconversion'' 500g",
     
     details:{
        description:"Gragnano de sa colline qui donne sur le Golfe de Naples, est depuis le XVI siècle la patrie de la pasta. ",
        comment:"Temps de cuisson : 16 minutes",
        hasGluten:true, 
        hasOgm:false,
        isBio:true, 
     },  
     
     attributes:{
        isAvailable:true,
        hasComment:false, 
        isDiscount:false
     },

     pricing: {
        stock:10, 
        price:3.80,
        discount:3.0,
     },
  
  };

  before(function(done){
    request(app)
      .post('/login')
      .send({ id: 12345, provider:"twitter" })
      .end(function(err,res){
        res.should.have.status(302);
        done();        
      });
  
  });

  it('GET /v1/products/100001 should return 401',function(done){
    request(app)
      .get('/v1/products/100001')
      .expect('Content-Type', /json/)
      .expect(401)
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });

  it('POST /v1/shops/:name/products should return 302 for anonymous',function(done){
    request(app)
      .post('/v1/shops/bicycle-and-rocket/products')
      .set('Content-Type','application/json')
      .send(p)
      .expect(302,done);
  });
    
  it('POST /v1/shops/:name/products should return 200 and created product',function(done){
    // shop must be managed
    // how to mockup login
    request(app)
      .post('/v1/shops/bicycle-and-rocket/products')
      .set('Content-Type','application/json')
      .send(p)
      .end(function(err,res){
        res.should.have.status(200);
        //console.log(res);
        done();        
      });
  });
  
});

