var db = require('mongoose'),
    validator = require('../../app/validator'),
    check = validator.check,
    ifCheck = validator.ifCheck;


exports.check   = check;
exports.ifCheck = ifCheck;

var user_address = exports.address =  function(address){
      ifCheck(address.region,    "Votre adresse n'est pas valide").isText().len(2, 30)
      ifCheck(address.primary,   "Votre adresse n'est pas valide").isBoolean()
      check(address.geo.lng,     "Votre adresse n'est pas valide").isFloat()
      check(address.geo.lat,     "Votre adresse n'est pas valide").isFloat()
      check(address.postalCode,  "Votre numéro postal n'est pas valide").isNumeric()
      ifCheck(address.floor,     "Votre étage n'est pas valide").isText().len(1, 30)
      check(address.streetAdress,"Votre adresse n'est pas valide").isText().len(10, 50)
      ifCheck(address.note,        "Votre note n'est pas valide").isText().len(4, 40)
      check(address.name,        "Votre nom d'adresse n'est pas valide").isText().len(2, 40)
}

/**
 *
 */
var user= exports.user = function(req){
    var u=(req.body)?req.body:req;

    if(u.email){
      ifCheck(u.email.address,   "Votre adresse email n'est pas valide").len(6, 64).isEmail();
    }

    if(u.name){
      ifCheck(u.name.familyName, "Votre nom de famille n'est pas valide").len(2, 64).isText();
      ifCheck(u.name.givenName,  "Votre prénom n'est pas valide").len(2, 64).isText();
    }

    if(!u.phoneNumbers.length){
      throw new Error("Vous devez définir au moins un téléphone");      
    }

    for( var i in u.phoneNumbers){ 
      check(u.phoneNumbers[i].what,   "Votre téléphone n'est pas valide").isText().len(4, 30)
      check(u.phoneNumbers[i].number, "Votre téléphone n'est pas valide").isText().len(10, 30)
    }

    for( var i in u.addresses){
      user_address(u.addresses[i])
    }

}

/**
 *
 */
exports.product = function(req){
    if (!req.body)return;
    if(req.body.title) check(req.body.title,"Le nom n'est pas valide ou trop long").len(3, 64).isText();
    
    
    if(req.body.details){
      check(req.body.details.description,"Le description n'est pas valide ou trop longue").len(3, 300).isText();
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
      req.body.available.comment && check(req.body.available.comment,"Le format du commentaire n'est pas valide").isText();
    }

    if (req.body.info){
      req.body.info.active && check(req.body.info.active).isBoolean();
      req.body.info.comment && check(req.body.info.comment,"Le format du commentaire n'est pas valide").len(6, 264).isText();
    }

    for (var i in req.body.faq){      
      check(req.body.faq[i].q,"La question n'est pas valide ou trop longue").len(3, 128).isText();
      check(req.body.faq[i].a,"La réponse n'est pas valide ou trop longue").len(3, 400).isText()
    }      
    
}

var order_items = exports.orderItems = function(items){
  for (var i in items){      
    check(items[i].sku).isNumeric()
    check(items[i].title,       "Le description n'est pas valide, top courte ou trop longue").isText().len(3, 300);
    check(items[i].categories,  "La catégorie n'est pas reconnu").isHexadecimal()
    check(items[i].vendor,      "Le vendeur n'est pas reconnu").isHexadecimal()

    check(items[i].quantity,    "La quantité n'est pas valable").isNumeric()
    check(items[i].price,       "Le prix n'est pas valable").isFloat()
    check(items[i].part,        "La portion du produit n'est pas valable").isText().len(1, 50);
    ifCheck(items[i].note,        "Le commentaire n'est pas valide, il est top court ou trop long").isText().len(0, 500);
    check(items[i].finalprice,  "Le prix final n'est pas correct").isFloat()
  }
}
/**
 *
 */
exports.order = function(req){
    if (!req.body)return;

    order_items(req.body.items)

    // if(req.body.customer){
    //   user(req.body.customer)
    // }

    if(req.body.shipping){
      user_address(req.body.shipping)
      check(req.body.shipping.when,"La commande doit contenir une date de livraison").isDate();
    }

    if(req.body.payment){
      // TODO check payment gateway for later
    }   
}

exports.orderFind = function(req){
}

exports.shop=function(shop){
    if (!shop)return;

    if(shop.name) check(shop.name,"Le nom n'est pas valide ou trop long").len(3, 48).isText()
    if(shop.description){
      check(shop.description,"La description n'est pas valide ou trop longue").len(3, 400).isText()
      console.log("FIXME sanitize")
      // shop.description=sanitize(shop.description,"La description n'est pas valide").xss();
    }
    
    if(shop.url) check(shop.url).len(6, 164).isUrl();

    if (shop.photo){
      shop.photo.bg && check(shop.photo.bg).len(6, 164).isUrl();
      shop.photo.fg && check(shop.photo.fg).len(6, 164).isUrl();
      shop.photo.owner && check(shop.photo.owner).len(6, 164).isUrl();
    }
    
    if (shop.details){
      shop.details.bio && check(shop.details.bio).isBoolean();
      shop.details.gluten && check(shop.details.gluten).isBoolean();
      shop.details.lactose && check(shop.details.lactose).isBoolean();
      shop.details.local && check(shop.details.local).isBoolean();
    }
    
    for (var i in shop.faq){      
      check(shop.faq[i].q,"La question n'est pas valide, trop courte ou trop longue").len(3, 128).isText();
      check(shop.faq[i].a,"La réponse n'est pas valide, trop courte ou trop longue").len(3, 400).isText();
    }
    
    if (shop.available){
      shop.available.active && check(shop.available.active).isBoolean();
      shop.available.comment && check(shop.available.comment,"Le commentaire n'est pas valide ou trop long").len(6, 264).isText();
    }

    if (shop.info){
      shop.info.active && check(shop.info.active).isBoolean();
      shop.info.comment && check(shop.info.comment,"Le format du commentaire n'est pas valide").len(6, 264).isText();
    }
      
    if(!shop.address && !shop.marketplace){
      throw new Error("Vous devez définir au moins une adresse de collecte");
    }

    if(shop.address){
      check(shop.address.name,"Le nom de votre adresse n'est pas valide").isText().len(4,30)
      check(shop.address.floor,"L'étage de votre adresse n'est pas valide").isText().len(1,5)
      check(shop.address.phone,"Le téléphone de votre adresse n'est pas valide").isText().len(4,30)
      check(shop.address.region,"La région de votre adresse n'est pas valide").isText().len(4,30)
      check(shop.address.postalCode,"Le code postal de votre adresse n'est pas valide").isNumeric()
    }
    for (var i in shop.marketplace){
        check(shop.marketplace[i],"Votre point de collect n'est pas valide").isText().len(4,45)
    }      
      
    

}

