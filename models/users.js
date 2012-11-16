
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  
 var CustomerSchema = new Schema({
    id    : Number,
    email : {type : String, index: { unique: true, required : true } },
    first : String,
    last  : String,
    crypted_password :String,
    auth_token : String,
    invoices : [{type: Schema.ObjectId, ref : 'Invoice'}]
});

CustomerSchema.statics.findByEmail = function(email, success, fail){
    this.model('Customers').findOne({email:email}, function(e, doc){
      if(e){
        fail(e)
      }else{
       success(doc);
     }
   });
  }

//the model uses the schema declaration  
module.exports = mongoose.model('Customers', CustomerSchema);



