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
  
var EnumDocumentType=function (type) {
  if(!config.shared){
    return false;
  }
  var types=config.shared.document.types.slice(0);
  if(config.shared.home){
    for (var i = config.shared.home.views.length - 1; i >= 0; i--) {
      types.push(config.shared.home.views[i].name.toLowerCase());
    };

  }

  return (types.indexOf(type.toLowerCase())!==-1);
};


// Product Model
var Document = new Schema({
  title:{en:String,fr:String,de:String},
  header:{en:String,fr:String,de:String},
  slug:[{type: String, required: true, unique:true }],
  content:{en:String,fr:String,de:String},
   
  photo:{
    header:{type:String},
    bundle:[String]
  },


  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  available:{type:Boolean,default:true},
  published:{type:Boolean,default:false},

  skus:[Number],
  type: {type:String, required:true
         ,validate: {
          validator: EnumDocumentType,
          message: '{VALUE} is not a valid document type!'
         }
        },
  owner:{type:Number, requiered:true},
  signature:{type:String, requiered:true}

});



//
// create a new document 'p' for the shop 's'
Document.statics.create = function(doc,uid,callback){
  assert(doc);
  assert(callback);
	var Documents=this;    

  if(!doc.slug){
    doc.slug=[];  
  }
  if(doc.title.fr)doc.slug.push(doc.title.fr.slug());
  if(doc.title.en)doc.slug.push(doc.title.en.slug());
  if(doc.title.de)doc.slug.push(doc.title.de.slug());
  doc.owner=uid;

        

  //
  // ready to create one product
  var myDocument=new  Documents(doc);
 
  return myDocument.save(callback);  
}; 


Document.statics.findOneBySlug = function(criteria, callback){
  var query=this.findOne({slug:criteria.slug});

  if(criteria.type){
    query.where({type:category})
  }

  if(callback)return query.exec(callback);
  return query;
};


Document.statics.findByCriteria = function(criteria, callback){
  var query=this.find({});
  //
  // fondByType
  if(criteria.type){
    query=query.where({type:criteria.type});
  }

  //
  // findBySlug
  if(criteria.slug){
    query=query.where({slug:criteria.slug});
  }

  //
  // findByUser
  if(criteria.uid){
    query=query.where({owner:criteria.uid});
  }

  //
  // findBySkus
  if(criteria.skus){
    query=query.where({skus:{$in:criteria.skus}});
  }


  if(callback) return query.exec(callback);
  return query;
};



Document.set('autoIndex', config.mongo.ensureIndex);
exports.Documents = mongoose.model('Documents', Document);


