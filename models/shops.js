
var debug = require('debug')('shops');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , validate = require('mongoose-validate')
  , ObjectId = Schema.ObjectId;
  


var Shops = new Schema({
    urlpath:{ type: String, required: true, unique:true },
    name: { type: String, required: true },
    description:{ type: String, required: true },
    bgphoto:{ type: String, required: true },
    fgphoto:{ type: String, required: true },
    user:[{type: Schema.ObjectId, ref : 'Users'}]
});


//
// API

Shops.statics.create = function(vendor, callback){

}; 

Shops.statics.findByPath = function(path, callback){

}; 

Shops.statics.findByUser = function(user, callback){

}; 

Shops.statics.update = function(user, callback){

}; 


module.exports =mongoose.model('Shops', Shops);


