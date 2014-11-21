var bus = require("./bus"),
    dummy=function(){},
    onTrace, onMessage;


onTrace=function(token,error){
    var msg=JSON.stringify(error,null,2);
    bus.emit( "sendmail",
              "evaleto@gmail.com","[kariboo-ui] : "+error.name,
              {content:msg}, "simple");

};

onMessage=function(title,content){
    console.log("-------------------------",title,content)
    var msg=JSON.stringify(content,null,2);
    bus.emit( "sendmail",
              "info@karibou.io",title,
              {content:msg}, "simple");

};

//
// bus message for system
bus.on('sendmail',dummy)
bus.on('cron.day',dummy)
bus.on('cron.day.19',dummy)
bus.on('cron.week',dummy)
bus.on('trace.error',onTrace) //signature(key, error)
bus.on('system.message',onMessage)
bus.on('github.push',dummy)

//
// bus message for orders
bus.on('order.create',dummy)
bus.on('order.rollback',dummy)
bus.on('order.update.items',dummy)

//
// bus message for users
bus.on('err.user.login',dummy)
bus.on('err.user.register',dummy)
bus.on('user.send.password',dummy)

//
// bus.on('',function(mail,cb){})
//module.exports=new Bus()
