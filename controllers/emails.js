
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
    if(req.body&&req.body.email) check(req.body.email).len(3, 34).isEmail();
    
}

exports.create=function (req, res) {
 

  db.model('Emails').create(req.user, function(err,email){
    if(err){
      //TODO error
    	res.status(400);
      return res.json({error:err});
    }      
    
    //
    // send email
    res.json(email);
  });
};


exports.validate=function (req, res) {
  //
  // check email owner 0
  try{
    check(req.params.uid).len(40).isAlphanumeric();    
  }catch(err){
    return res.send(400, err.message);
  }
    
  Emails.validate(req.params.uid,function (err,email){

    if (err){
    	res.status(200);
      return res.json({error:err});    
    }
    

    return res.json(email);  
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
