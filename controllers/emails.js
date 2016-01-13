
/*
 * home
 */


var db = require('mongoose');
var Emails = db.model('Emails');

var check = require('../app/validator').check,
    sanitize = require('../app/validator').sanitize,
    errorHelper = require('mongoose-error-helper').errorHelper,
    bus=require('../app/bus'),
    _=require('underscore');


function check(req){
    if(req.body&&req.body.email) check(req.body.email).len(3, 40).isEmail();
    
}

exports.create=function (req, res) {
 
  try{
    check(req.user.email.address, "Vous devez avoir une adresse email valide").len(3, 34).isEmail();    
  }catch(err){
    return res.status(400).send( err.message);
  }  


  db.model('Emails').create(req.user, function(err,validate){
    if(err){
      return res.status(400).send(err);
    }      
    
    var content=req.user;
    content.validate=validate;
    content.origin=req.header('Origin')||config.mail.origin;
    console.log(content.origin+'/validate/'+validate.uid+'/'+validate.email)
    bus.emit('sendmail',req.user.email.address, 
                 "Confirmation de votre adresse e-mail", 
                 content, 
                 "confirm", function(err, status){
      if(err){
        console.log(err,status)
        return validate.remove(function(){
          return res.status(400).send('Oops, quelque chose est allé de travers avec la messagerie: '+err.message);
        });

      }      
                 
      res.json(validate);                 
    })
  });
};


exports.validate=function (req, res) {
  //
  // check email owner 0
  try{
    check(req.params.uid).len(40).isAlphanumeric();    
    check(req.params.email).len(3,40).isEmail();    
  }catch(err){
    return res.status(400).send( err.message);
  }
    
  Emails.validate(req.params.uid,req.params.email,function (err,user){

    if (err){
      return res.status(400).send(err);    
    }
    

    return res.send("Ok");  
  });
};



exports.list=function (req, res) {
  Emails.find({})/*.where("status",true)*/.exec(function (err,emails){
    if (err){
      return res.status(400).send(errorHelper(err));    
    }
    

    return res.json(emails);  
  });

};
