var Users = require('mongoose').model('Users'),
    Products=require('mongoose').model('Products'),
    Q=require('q'),
    debug = require('debug')('reminder');
  
exports.reminder=function(cron,bus) {
  var now=new Date(), reminder={
    weekdays:[now.getDay()],
    time:now.getHours()
  };

  //
  // list all users that subscribe to a reminder!
  Users.findByReminder(reminder).then(function(users) {
    debug("reminder: users %d ",users.length)

    if(!users||!users.length){
      return;
    }

    // list discount products
    Products.findByCriteria({ 
      status:true,instock:true,available:true,discount:true
    }).then(function (products) {

      // context
      var promises=users.map(function(user) {
        var defer=Q.defer(), mail={
          user:user,
          origin:config.mail.origin,
          noCC:true,
          products:products.slice(0,4),
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


    });


  })
};


