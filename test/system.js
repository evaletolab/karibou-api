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

  describe("Administration", function(){
  
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
            cb(a+'-1')
        })
        bus.on('test',function(a,cb){
            cb(a+'-2')
        })

        //
        // this emiter will receive multiple callback 
        // and this is an issue because only one done is permitted
        bus.emit('test','msg',function(out){

            //console.log(out,bus.listeners('test').length)            
            if(++em===2)done()
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
        },50)


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

