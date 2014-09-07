var bus = require("bus");
var dummy=function(){}

//
// bus message for system
bus.on('sendmail',dummy)  
bus.on('cron.day',dummy)  
bus.on('cron.week',dummy)  

//
// bus message for orders
bus.on('order.create',dummy)
bus.on('order.rollback',dummy)
bus.on('order.update.items',dummy)

//
// bus message for users
bus.on('err.user.login',dummy)
bus.on('err.user.register',dummy)

//
// bus.on('',function(mail,cb){})	
//module.exports=new Bus()
