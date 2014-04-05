
/*
 * Users API
 */
var db = require('mongoose'),
    bus=require('../app/bus')
    Users= db.model('Users'),
    password = require('password-generator'),
    validate = require('./validate/validate'),
    errorHelper = require('mongoose-error-helper').errorHelper;
;



exports.ensureMe=function(req, res, next) {
    
  //
  // ensure auth
	if (!req.isAuthenticated()) { 
      return res.send(401);	
	}

  // if not me,  
  var me=parseInt(req.params.id)||req.body.id;
  if (req.user.id!==me) { 
      return res.send(401, "Vous n'êtes le propriétaire de ce compte");	
	}
	
  return next();
}




exports.me = function (req, res, next)  {
  res.json(req.user);
  // Users.findOne({_id:req.user._id}).
  //   populate('shops','likes').exec(function(err,user){
  //     res.json(user);
  // });
};


exports.list = function (req, res, next)  {
  //
  // TODO add criteria
  Users.find({}).populate('shops','likes').exec(function(err,users){
      if (err){
        return res.send(400,errorHelper(err));    
      }
      users.forEach(function(user){
        if( user.email&&user.email.address && config.admin.emails.indexOf(user.email.address)!=-1){
          user.roles.push('admin');
        }        
      })
      return res.json(200,users);
  });
}

exports.recover=function(req,res){
  try{
    //check(req.params.token,"token inconnu").isEmail();
    validate.check(req.params.email,"Utilisateur inconnu").isEmail();
  }catch(err){
    return res.send(400, err.message);
  }  


  Users.findOne({'email.address': req.params.email},
    function(err,user){
      
      if (err){
        return res.send(400,err);    
      }
      if(!user){
        return res.send(400,"Utilisateur inconnu");    
      }
  
      //
      // change the password
      var content=user;      
      content.password=user.password=password();  
      user.save(function(err){
        if(err)return res.send(400,err);    
        

        //
        // send email
        bus.emit('sendmail',user.email.address, 
                     "Vous avez un nouveau mot de passe", 
                     content, 
                     "password", function(err, status){
          if(err){
            return res.send(400,err);
          }      
                     
          return res.json("Un nouveau mot de passe à été envoyé à votre adresse mail.");  
        });
        
        
      });      
      
  });
};

exports.password=function(req,res){

  try{
    validate.check(req.params.id).isInt();
    validate.check(req.body.email).isEmail();
    validate.check(req.body.new,"Votre nouveau password est trop court ou trop long").len(4,32);
    if(!req.body.current && req.user.hash) throw new Error("Il manque votre password");
  }catch(err){
    return res.send(400, err.message);
  }  

      
  var stderr="L' utilisateur "+req.body.email+"@"+req.params.id+" n'existe pas ou son mot de passe est incorrect";
  
  Users.findOne({'email.address': req.body.email, id:req.params.id},
    function(err,user){
      if (err){
        return res.send(400,err);    
      }
      //
      // check user
      if(!user){
        return res.send(400,stderr);    
      }
      
      //
      // check password
      if(req.user.hash){user.verifyPassword(req.body.current, function(err, passwordCorrect) {
          if (err) {           
            return res.send(400,err);    
          }
          if (!passwordCorrect) { 
            return res.send(400,stderr+" (2)");    
          }
          
          //
          // change the password
          user.password=req.body.new;
          user.save(function(err){
            if(err)return res.send(400,err);    
            return res.json({});  
          });
        });
      }else{
        //
        // set the password
        user.password=req.body.new;
        user.save(function(err){
          if(err)return res.send(400,err);    
          return res.json({});  
        });
      }
      
  });

};

exports.update=function(req,res){

  try{
    validate.check(req.params.id).isInt();
    validate.user(req);
  }catch(err){
    return res.send(400, err.message);
  }  
      

  Users.update({id:req.params.id},req.body,function(err,user){
    if (err){
      return res.send(400,errorHelper(err));    
    }
    return res.json(user);  
  });

};

exports.unlike=function(req,res){

  try{
    validate.check(req.params.id).isInt();
    validate.check(req.params.sku).isInt();
  }catch(err){
    return res.send(400, err.message);
  }  
      
  Users.unlike(req.params.id,params.sku,function(err,user){
    if (err){
      return res.send(400,errorHelper(err));    
    }
    return res.json(user);  
  });

};

exports.like=function(req,res){

  try{
    validate.check(req.params.sku).isInt();
  }catch(err){
    return res.send(400, err.message);
  }  
      
  Users.like(req.user.id, req.params.sku,function(err,user){
    if (err){
      return res.send(400,errorHelper(err));    
    }
    req.user.likes=user.likes;
    return res.json(user);  
  });

};


exports.status=function(req,res){

  try{
    validate.check(req.params.id).isInt();
    if(req.body.status===undefined)throw new Error("Invalid request");;
  }catch(err){
    return res.send(400, err.message);
  }  
      
  Users.updateStatus({id:req.params.id},req.body.status,function(err,user){
    if (err){
      return res.send(400,errorHelper(err));    
    }
    return res.json(user);  
  });

};

