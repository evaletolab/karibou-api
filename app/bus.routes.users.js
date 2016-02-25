var Users = require('mongoose').model('Users'),
    Orders=require('mongoose').model('Orders')
    Q=require('q');
  
exports.reminder=function(cron) {
  var now=new Date(), reminder={
    weekdays:[now.getDay()],
    time:now.getHours()
  };

  console.log('----------------- CRON',JSON.stringify(reminder))
  //
  // list all users that subscribe to a reminder!
  Users.findByReminder(reminder).then(function(users) {
    console.log('----------------- reminder',users.length)
    var promises=users.map(function(user) {
      var defer=Q.defer(), mail={
        user:user,
        origin:config.mail.origin,
        withHtml:true
      };

      //
      // send email
      bus.emit('sendmail',user.email.address,
           "Psst, c'est peut être le moment de préparer une commande", mail,"order-reminder",
           function (err,res) {
              if(err){return defer.reject(err);}
              defer.resolve(res);
            });
      return defer.promise;
    });

  })
};


