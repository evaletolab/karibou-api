
var debug = require('debug')('config');
var assert = require("assert");

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , _ = require('underscore')
  , ObjectId = Schema.ObjectId;
  


var Config = new Schema({
    // instance of config
    cid:{type:String,default:'main',required: true, unique:true, trim:true},

    //
    // display message wheb maintenance (that mean that all shipping are off)
    maintenance:{
      reason:{en:String,fr:String,de:String},
      active:{type:Boolean,default:false}
    },

    //
    // display message on front
    messages:[{
      content:{en:String,fr:String,de:String},
      active:{type: Boolean,default:false},
      updated:{type:Date, default: Date.now}
    }],


    //
    // home
    home:{
      // display love in home?
      love:Boolean,
      // display campagn page in home?
      path:String,
      siteName:{
        en:String,de:String,fr:String,
        image:String
      },
      about:{
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      tagLine:{
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      footer:{
        h:{en:String,de:String,fr:String},
        p:{en:String,de:String,fr:String},
        image:String
      },
      views:[{
        name:{en:String,fr:String,de:String},
        weight:{type:Number,default:1},
        url:String
      }]
    },


    // 
    // select no shipping dates
    noshipping:[{
      reason:{type: String},
      from:{type:Date},
      to:{type:Date}
    }],

    //
    // menu
    menu:[{
      name:{en:String,fr:String,de:String},
      url:String,
      weight:{type:Number,default:1},
      group:{type:String,default:'main'},
      active:Boolean
    }],


    //
    // defines keys
    keys:{
      pubStripe:String,
      pubGithub:String,
      pubUpcare:String,
      pubMap:String,
      pubDisqus:String
    }
});

Config.statics.getMain=function(cb) {
  var Config=mongoose.model('Config');
  var query=Config.findOne({cid:'main'}).select('-_id -__v');
  //
  // use plain javascript object
  query.lean();
  query.exec(function(err,c){
    if(err){return cb(err)};
    // first time collection is empty
    if(!c){
      return (new Config({})).save(cb)
    }
    return cb(null,c)
  });
};

Config.statics.saveMain=function(c, cb) {
  var Config=mongoose.model('Config');
  Config.findOne({cid:'main'}).select('-__v').exec(function(e,conf){
    if(e){return cb(err)};
    _.extend(conf,c);
    conf.save(function(e,c) {
      _.extend(config.shared,conf.toObject())
      cb(e,c)
    })
  });
};


Config.set('autoIndex', config.mongo.ensureIndex);
module.exports =mongoose.model('Config', Config);


