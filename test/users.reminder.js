// Use a different DB for tests
var app = require("../app");

var db = require("mongoose");

var dbtools = require("./fixtures/dbtools");
var should = require("should");
var data = dbtools.fixtures(["Users.reminder.js"]);




describe("users.reminder", function(){

  before(function(done){
    dbtools.clean(function(e){
      dbtools.load(["../fixtures/Users.reminder.js"],db,function(err){
        should.not.exist(err);
        // db.model('Users').find({}).exec(function(e,us) {
        //   us.forEach(function (u) {
        //     console.log('-------------',u.id,u.email.address,JSON.stringify(u.reminder))
        //   })
        // })  
        done();
      });
    });      
  });  

  after(function(done){
    dbtools.clean(function(){
      done();
    });      
  });


  it('find users with reminder weekday(0),time(11) should return 0',function(done) {
    var reminder={
      weekdays:[0],time:11
    };
    db.model('Users').findByReminder(reminder).then(function(users) {
      setTimeout(function() {
        users.length.should.equal(0);
        done()
      });
    })
  })

  it('find users with reminder weekday(1),time(10) should return 0',function(done) {
    var reminder={
      weekdays:[1],time:10
    };
    db.model('Users').findByReminder(reminder).then(function(users) {
      setTimeout(function() {
        users.length.should.equal(0);
        done()
      });
    })
  })

  it('find users with reminder weekday(1),time(11) should return 2',function(done) {
    var reminder={
      weekdays:[1],time:11
    };
    db.model('Users').findByReminder(reminder).then(function(users) {
      setTimeout(function() {
        users.length.should.equal(2);
        done()
      });
    })
  })


  it('activate reminder for user evaleto@gmail.com',function(done) {
    db.model('Users').findAndUpdate(12346,{reminder:{active:true}}).then(function(user) {
      user.reminder.active.should.equal(true);
      should.exist(user.reminder.weekdays)
      should.exist(user.reminder.time)
      done()
    })
  })

  it('find activated previous reminder weekday(0),time(11) should return 1',function(done) {
    var reminder={
      weekdays:[0],time:11
    };
    db.model('Users').findByReminder(reminder).then(function(users) {
      setTimeout(function() {
        users.length.should.equal(1);
        done()
      });
    })
  })

  it('find users with reminder weekday 10',function(done) {
    done()
  })

    
  
});

