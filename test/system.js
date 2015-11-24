// Use a different DB for tests
var app = require("../app");

var db = require('mongoose');
var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.js","Categories.js","Shops.js",'Products.js']);


describe("system", function(){

  before(function(done){
    done()
  });
  describe("tools", function(){
    it("Sort array of ['2012.12','2012.13']",function (done) {
      var a=[ 
        '2014.11','2014.12','2015.1','2015.2','2015.7','2015.8','2015.9','2015.10','2015.11'
        ].sortSeparatedAlphaNum(),
          b=[ '2014.11','2014.12','2015.1','2015.2','2015.7','2015.8','2015.9','2015.10','2015.11'];

      a.should.eql(b);
      done()
    })

    it("Crypt string", function(done){
        var crypt="Hello World".crypt()
            done()
    });

    it("DeCrypt string", function(done){
        "Hello World".crypt().decrypt().should.equal("Hello World")
        done()
    });


    it("DeCrypt string without padding", function(done){
        "6faad2f00aa175cafb0e0cb425f3ba9b7433379b88a443acd675a13b20db6642".decrypt().should.equal("ch_16aUeYBTMLb4og7PSbvQwVpl")
        done()
    });


    it("DeCrypt string with padding in code", function(done){
        "ch_16aUeYBTMLb4og7PSbvQwVpl".crypt().decrypt().should.equal("ch_16aUeYBTMLb4og7PSbvQwVpl")
        done()
    });

    it("crypt already crypted string", function(done){
        "olivier".crypt().crypt().crypt().decrypt().should.equal("olivier")
        done()
    });



    it("check result when somming products prices",function(done){
        var prices=[7.9,4.0,4.2,4.00,5.00,6.50,9.00,4.90,16.00,7.90,7.90,4.20,7.40], total=0.0;
        prices.forEach(function(p){
            total+=p;
        })

        total+=10

        // console.log('x20',(total*20))
        // console.log('ceil',Math.ceil(total*20))
        // console.log('round',Math.round(total*20))
        // console.log('total',total, parseFloat((Math.round(total*20)/20).toFixed(2)))
        done()
    })
  });

  describe("Administration", function(){
  
    it("Get default stored config",function(done) {
        db.model('Config').getMain(function(e,c) {
            should.not.exist(e);
            should.exist(c);
            should.exist(c.messages);
            should.exist(c.maintenance);
            done()
        })
    })

    it("Save default stored config",function(done) {
        var c={
            messages:[{content:'hello',active:true,updated:Date.now()}],
            noshipping:[{reason:'paques',when:Date.now()}],
            other:'not possible'
        }
        db.model('Config').saveMain(c,function(e,c) {
            should.not.exist(e);
            should.exist(c);

            done()
        })
    })

    it.skip("Contact customers directly via email or newsletters", function(done){
    });

    it.skip("Contact customers directly via twitter", function(done){
    });
    
    it.skip("Easily backup and restore", function(done){
    });

    it.skip("Print invoices and packaging lists from the order screen", function(done){
    });

    it.skip("Statistics for products and customers", function(done){
    });
    
    it.skip("Requets the shop creation", function(done){
    });

    it.skip("New shop is accepted", function(done){
    });

    it.skip("New shop is denied", function(done){
    });
    
  });
  
 
  describe("System notifications", function(){
    it("Basic testing of the Bus", function(done){
        var bus=require('../app/bus'), em=0;
        bus.on('test',function(a,cb){
            cb(0,a+'-1')
        })
        bus.on('test',function(a,cb){
            cb(0,a+'-2')
        })

        //
        // this emiter will receive multiple callback 
        // and this is an issue because only one done is permitted
        bus.emit('test','msg',function(out){

            //console.log(out,bus.listeners('test').length)            
            if(++em===2)done()
        })
    });

    it.skip("Basic testing of the Bus and promise", function(done){
        var bus=require('../app/bus'), em=0;
        bus.on('test',function(a,cb){
            cb(0,a+'-1')
        })
        bus.on('test',function(a,cb){
            cb(0,a+'-2')
        })

        //
        // this emiter will receive multiple callback 
        // and this is an issue because only one done is permitted
        bus.emit('test','msg').then(function(out){
            done()
        })
    });

    it.skip("Simple queue", function(done){
        var queue=require('../app/queue')();
        queue.defer(require('fs').stat, __dirname + "/../package.json")
        queue.defer(require('fs').stat, __dirname + "/../app.js")
        queue.awaitAll(function(err,a,b){
            done();
        });
    })

    it("testing of simple queue", function(done){
        var queue=require('../app/queue')(), err=0,task=0;
        queue.empty(function(e){
            err.should.equal(1);
            task.should.equal(4)
            done();        
            //    
            // queue is empty but 50ms after 2 more task started on next test. 
            queue.empty(function(){})
        })

        var cb=function(e,a){
            e&&err++;task++
        }
        queue.defer(function(v, callback) { setTimeout(function() { callback(null, "task1"); }, 10); },'input',cb)
        queue.defer(function(v, callback) { setTimeout(function() { callback(null, "task2"); }, 3); },'input',cb)
        queue.defer(function(v, callback ) { setTimeout(function() { callback(null, "task3"); }, 10); },'input',cb)
        queue.defer(function(v, callback ) { setTimeout(function() { callback(1, "task4"); }, 3); },'input',cb)
        setTimeout(function(){
            queue.defer(function(v, callback ) { setTimeout(function() { callback(null, "task5"); }, 3); },'input',cb)
            queue.defer(function(v, callback ) { setTimeout(function() { callback(null, "task6"); }, 3); },'input',cb)
        },100)


    })

    it("testing of simple queue with http.request", function(done){
        var request= require('supertest'), app=require('express')();
        var queue=require('../app/queue')();
        var task=[]

        queue.empty(function(e){
            // console.log(task)
            task[0].should.equal('task1')
            task[1].should.equal('task2')
            done();            
        })
        var queued=function(f){
            return function(req,res){
              queue.defer(f,req,res)
            }
        }

        app.get('/race/condition/1', queued(function(req, res){
            setTimeout(function(){res.send(200,'task1')},50);            
        }));        
        app.get('/race/condition/2',queued(function(req, res){
          setTimeout(function(){res.send(200,'task2')},0);            
        }));        

        request(app).get('/race/condition/1')
          .end(function(err, res){
            task.push(res.text)
          });
        request(app).get('/race/condition/2')
          .end(function(err, res){
            task.push(res.text)
          });

    })


    


    it.skip("Customers read all notifications", function(done){
    });
    
    it.skip("On subscribed vendor, customer is notified of activities", function(done){
    });

    it.skip("On subscribed product, customer is notified of activities [disabled/enabled/deleted]", function(done){
    });  
    
  });
    


});

