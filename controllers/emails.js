
/*
 * home
 */

var db=require('../app/config');
var _=require('underscore');
var assert = require("assert");

var db = require('mongoose');
var Emails = db.model('Emails');

var check = require('validator').check,
    sanitize = require('validator').sanitize;


function check(req){
    if(req.body&&req.body.email) check(req.body.email).len(3, 40).isEmail();
    
}

exports.create=function (req, res) {
 

  db.model('Emails').create(req.user, function(err,validate){
    if(err){
      return res.json(400,err);
    }      
    
    var content=req.user;
    content.validate=validate;
    //
    // send email
    req.sendmail(req.user.email.address, 
                 "Confirmation de votre adresse e-mail", 
                 content, 
                 "confirm", function(err, status){
      if(err){
        console.log(err,status)
        return res.json(400,err);
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
    return res.send(400, err.message);
  }
    
  Emails.validate(req.params.uid,req.params.email,function (err,user){

    if (err){
      return res.json(400,err);    
    }
    

    return res.send("Ok");  
  });
};



exports.list=function (req, res) {
  Emails.find({})/*.where("status",true)*/.exec(function (err,emails){
    if (err){
    	res.status(400);
      return res.json({error:err});    
    }
    

    return res.json(emails);  
  });

};
