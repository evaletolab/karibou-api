var bus = require("./bus"),
    mailchimp =require("./bus.routes.mailchimp"),
    activity =require("./bus.routes.activity"),
    users =require("./bus.routes.users"),
    cron =require("./bus.routes.cron")(bus),
    dummy=function(){},
    onTrace, onMessage;



onTrace=function(token,error){
    var msg=JSON.stringify(error,null,2);
    bus.emit( "sendmail",
              "evaleto@gmail.com","[karibou-ui] : "+error.name,
              {content:msg}, "simple");

};

onMessage=function(title,content){
    var msg=JSON.stringify(content,null,2);
    bus.emit( "sendmail",
              "info@karibou.ch",title,
              {content:msg}, "simple");

};

onPush=function(event,git){
  console.log("github ----------------",sig,id,event,req.body)
}



//
// bus message for system
bus.on('sendmail',dummy)
bus.on('cron.day',dummy)
bus.on('cron.day.19',dummy)
bus.on('cron.week',dummy)
bus.on('trace.error',onTrace) //signature(key, error)
bus.on('system.message',onMessage)
bus.on('github.push',onPush)

//
// bus message for orders
bus.on('order.create',dummy)
bus.on('order.rollback',dummy)
bus.on('order.update.items',dummy)
bus.on('order.cancel',dummy)
bus.on('order.mail.reminder',users.reminder)

//
// bus message for users
bus.on('err.user.login',dummy)
bus.on('err.user.register',dummy)
bus.on('user.send.password',dummy)

bus.on('mailchimp.subscribe',mailchimp.subscribe)

bus.on('activity.create',activity.create);
bus.on('activity.update',activity.update);
bus.on('activity.delete',activity.delete);
bus.on('activity.error',dummy);

//
// bus.on('',function(mail,cb){})
//module.exports=new Bus()
