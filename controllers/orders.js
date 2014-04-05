
/*
 * orders
 */

require('../app/config');
var db = require('mongoose');
var Orders = db.model('Orders');
var _=require('underscore');

var check = require('../app/validator').check,
    sanitize = require('../app/validator').sanitize,
    errorHelper = require('mongoose-error-helper').errorHelper;



function checkParams(req){
    if (!req.body)return;

    for (var i in req.body.items){      
      check(re.body.items[i].sku).isNumeric()
      check(re.body.items[i].title,       "Le description n'est pas valide, top courte ou trop longue").isText().len(3, 300);
      check(re.body.items[i].categories,  "La catégorie n'est pas reconnu").isHexadecimal()
      check(re.body.items[i].vendor,      "Le vendeur n'est pas reconnu").isHexadecimal()

      check(re.body.items[i].quantity,    "La quantité n'est pas valable").isNumeric()
      check(re.body.items[i].price,       "Le prix n'est pas valable").isFloat()
      check(re.body.items[i].part,        "La partie n'est pas valable").isNumeric()
      check(re.body.items[i].note,        "Le commentaire n'est pas valide, il est top court ou trop long").isText().len(3, 500);
      check(re.body.items[i].finalprice,  "Le prix final n'est pas correct").isFloat()
    }


    if(req.body.customer){
      
    }

    if(req.body.shipping){
      
    }

    if(req.body.payment){
      
    }
    
    
    if(req.body.details){
      check(req.body.details.description,"Le description n'est pas valide, top courte ou trop longue").len(3, 300);;
      req.body.details.bio && check(req.body.details.bio).isBoolean();
      req.body.details.gluten && check(req.body.details.gluten).isBoolean();
      req.body.details.lactose && check(req.body.details.lactose).isBoolean();
      req.body.details.local && check(req.body.details.local).isBoolean();

    }else{
      throw new Error("Vous devez définir une description");
    }
    
    if(req.body.pricing){
      check(req.body.pricing.price, "La valeur du prix n'est pas correct").isFloat();
      req.body.pricing.discount&&check(req.body.pricing.discount, "La valeur du discount n'est pas correct").isFloat();
      
      check(req.body.pricing.stock, "La valeur du stock n'est pas correct").isInt();
      check(req.body.pricing.part, "La valeur d'une portion n'est pas correct").len(3, 10);
    }else{
      throw new Error("Vous devez définir un prix");
    }

    if (req.body.photo){
      req.body.photo.bg && check(req.body.photo.bg).len(6, 164).isUrl();
      req.body.photo.fg && check(req.body.photo.fg).len(6, 164).isUrl();
      req.body.photo.owner && check(req.body.photo.owner).len(6, 164).isUrl();
    }else{
      throw new Error("Vous devez définir une photo");      
    }
        
    
    if (req.body.available){
      req.body.available.active && check(req.body.available.active).isBoolean();
      req.body.available.comment && check(req.body.available.comment,"Le format du commentaire n'est pas valide").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }

    if (req.body.info){
      req.body.info.active && check(req.body.info.active).isBoolean();
      req.body.info.comment && check(req.body.info.comment,"Le format du commentaire n'est pas valide").len(6, 264).is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?`{}\[\] ]+$/);
    }

    for (var i in req.body.faq){      
      check(req.body.faq[i].q,"La question n'est pas valide, top courte ou trop longue").len(3, 128);//.is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=? ]+$/);
      check(req.body.faq[i].a,"La réponse n'est pas valide, top courte ou trop longue").len(3, 400);//.is(/^[a-zA-ZÀ-ÿ0-9',:;.!?$"*ç%&\/\(\)=?` ]+$/);
    }      
    
}

exports.list = function(req,res){    
};

exports.verify = function(req,res){   
  var cart=req.body.cart;
  if(!cart || !Array.isArray(cart)){
    return res.send(400, "invalid cart.");
  }
  
  db.model('Orders').checkItems(cart,function(err,products){
    if(err){
      return res.send(400, err);
    }
    return res.json(cart)
  });
};

exports.create=function(req,res){

  // check && validate input field
  try{
    check(req.params.sku, "Le format SKU du produit n'est pas valide").len(3, 34).isNumeric();    
    checkParams(req);
  }catch(err){
    return res.send(400, err.message);
  }  

  // check value from config.shop.order.timeoutAndNotPaid
  //order.findByTimeoutAndNotPaid(function(err,orders){})
  //order.rollbackProductQuantityAndSave(function(err){})
}