var Activity = require('mongoose').model('Activities'),
    Q=require('q');

var log=exports.log=function(who, what, content, cb) {
  var deferred = Q.defer();

  Activity.create(who,what,content,function (err,result) {

    if(err){
      if(cb){return cb(err);}
      return deferred.reject(err);
    }
    if(cb){
      return cb(0,result)
    }
    deferred.resolve(result);
  })

  //
  // flexible use of cb or promise
  return  deferred.promise;
}      
      
exports.create=function(who, what, content, cb) {
  what.action='create';
  return log(who,what,content,cb);
};

exports.update=function(who, what, content, cb) {
  what.action='update';
  return log(who,what,content,cb);
};

exports.delete=function(who, what, content, cb) {
  what.action='delete';
  return log(who,what,content,cb);
};


exports.error=function(who, what, content, cb) {
  what.action='error';
  return log(who,what,content,cb);
};

