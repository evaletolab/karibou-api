//
// refs:
// - http://kylebanker.com/blog/2010/04/30/mongodb-and-ecommerce/
// - http://pixelhandler.com/blog/2012/02/09/develop-a-restful-api-using-node-js-with-express-and-mongoose/

//
// have a look on docs/documents-*.json for examples
//

var debug = require('debug')('documents');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;
  

var EnumDocumentType=config.shop.document.types;




// Product Model

var Document = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique:true },
  content:{type:String, required:true},
   
  photo:{
    header:{type:String},
    bundle:[String]
  },


  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  available:{type:Boolean,default:true},
  published:{type:Boolean,default:false},

  skus:[Number],
  type: {type:String, required:true,  enum:EnumDocumentType},
  owner:{type:Number, requiered:true}  
});



//
// create a new document 'p' for the shop 's'
Document.statics.create = function(doc,callback){
  assert(doc);
  assert(callback);
	var Documents=this;    
        
  doc.slug=doc.title.slug();

  //
  // ready to create one product
  var myDocument =new  Documents(doc);
 
  myDocument.save(callback);  
}; 


Document.statics.findOneBySlug = function(criteria, callback){
  var query=this.findOne({slug:criteria.slug});

  if(criteria.type){
    if(EnumDocumentType.indexOf(criteria.type)===-1){
      return callback("Le type du document n'est pas valable: "+type);
    }
    query.where({type:category})
  }

  if(callback)return query.exec(callback);
  return query;
};


Document.statics.findByCrireria = function(criteria, callback){
  var query=this.find({});
  //
  // fondByType
  if(criteria.type){
    if(EnumDocumentType.indexOf(criteria.type)===-1){
      return callback("Le type du document n'est pas valable: "+type);
    }
    query.where({type:criteria.type});
  }

  //
  // findByUser
  if(criteria.uid){
    query.where({owner:criteria.uid});
  }

  //
  // findBySkus
  if(criteria.skus){
    query.where({skus:{$in:criteria.skus}});
  }


  if(callback) return query.exec(callback);
  return query;
};



Document.set('autoIndex', config.mongo.ensureIndex);
exports.Documents = mongoose.model('Documents', Document);


