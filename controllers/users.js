
/*
 * Users API
 */
var db = require('mongoose'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;

function check(req){
    if(req.body.email.address) check(req.body.email.address).len(6, 64).isEmail();
    if(req.body.name.familyName) check(req.body.name.familyName).len(2, 64).isAlphanumeric();
    if(req.body.name.givenName) check(req.body.name.givenName).len(2, 64).isAlphanumeric();
}

exports.me = function (req, res, next)  {

  if (!req.isAuthenticated()) { 
      res.statusCode = 401;
      res.send(401);
      return;
  }
  res.json(req.user);
};

exports.update=function(req,res){

  try{
    check(req.params.id).isInt();
    check(req);
  }catch(err){
    return res.send(400, err);
  }  
      
  
  db.model('Users').update({id:req.params.id},req.body,function(err,user){
    if (err){
      return res.json(400,err);    
    }
    return res.json(user);  
  });

};

