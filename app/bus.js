var util = require("util");
var events = require("events");

var Bus=function(){
	events.EventEmitter.call(this);
}

Bus.prototype.listeners=function(event){
	events.EventEmitter.listenerCount(Bus, event)	
}

util.inherits(Bus, events.EventEmitter);

//
// bus.emit('sendmail',{to,from},cb)
// bus.on('sendmail',function(mail,cb))	
module.exports=new Bus()
