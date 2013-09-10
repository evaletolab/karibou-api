var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;


var DbMaintain = new Schema({
	version: { type: Number, required: false, unique:true},
  log: { type: String, required: false},
  date: {type:Date, default: Date.now}
});


// a new DbMaintain is only created if there is not already an existing entry
DbMaintain.statics.save = function(maintain, callback){
  var Maintain = this.model('DbMaintain');
    var dbm = Maintain(maintain);
    dbm.save(function (err, doc){
      return callback(err,doc);
    });
}; 


DbMaintain.statics.findAll = function(callback){
    this.model('DbMaintain').find('{}', function(err, maintain){
      return callback(err, maintain);
    });
};


DbMaintain.statics.findLatestVersion = function(callback){
    var Maintain=this.model('DbMaintain');
    Maintain.find('{}', 'version', {limit: 1, sort:{_id:-1}}, function(err, versionColl){
      var version = (versionColl[0])?(versionColl[0].version):(0);
      return callback(err, version);
    });
};

DbMaintain.set('autoIndex', config.mongo.ensureIndex);
module.exports = mongoose.model('DbMaintain', DbMaintain);
