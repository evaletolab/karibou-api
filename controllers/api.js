
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    origins=[]

//
// authorized origins
function btoa(str){
  return new Buffer(str).toString('base64')
}

config.cors.allowedDomains.forEach(function(origin){
  origins.push(btoa(origin))
})

exports.index = function(app){
  return function(req, res) {
    var model={ 
      api: app.routes, 
      user: req.user, 
      filter:function(api){
        return _.filter(api, function(route){return route.path.indexOf("/v1")>-1;});
      } 
    };
    res.render('home',  model);
  }
};




exports.config = function(req, res) {
    //
    // admin you get server env
    if (req.user&&req.user.isAdmin()) { 
      config.shop.env=process.env;
    }
    res.json(config.shop);
};



exports.trace = function(req, res) {
    if(origins.indexOf(req.params.key)==-1){
      return res.send(401,"invalid token")
    }
    bus.emit('trace.error',req.params.key,req.body);

    console.log("ERROR[UI]",req.body.name,req.body.url, req.body.stack[0].context)
    res.json({});
};
