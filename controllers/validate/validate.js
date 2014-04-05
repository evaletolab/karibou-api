var db = require('mongoose'),
    validator = require('../../app/validator'),
    check = validator.check,
    ifCheck = validator.ifCheck;


exports.check   = check;
exports.ifCheck = ifCheck;

/**
 *
 */
exports.order = function(req){
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
}

/**
 *
 */
exports.user = function(req){
    if(req.body.email){
      ifCheck(req.body.email.address,   "Votre adresse email n'est pas valide").len(6, 64).isEmail();
    }

    if(req.body.name){
      ifCheck(req.body.name.familyName, "Votre nom de famille n'est pas valide").len(2, 64).isText();
      ifCheck(req.body.name.givenName,  "Votre prénom n'est pas valide").len(2, 64).isText();
    }


    for( var i in req.body.phoneNumbers){ 
      ifCheck(req.body.phoneNumbers[i].what,   "Votre téléphone n'est pas valide").isText().len(10, 30)
      ifCheck(req.body.phoneNumbers[i].number, "Votre téléphone n'est pas valide").isText().len(10, 30)
    }

    for( var i in req.body.addresses){
      ifCheck(req.body.addresses[i].region,    "Votre adresse n'est pas valide").isText().len(10, 30)
      ifCheck(req.body.addresses[i].primary,   "Votre adresse n'est pas valide").isBoolean()
      check(req.body.addresses[i].geo.lng,     "Votre adresse n'est pas valide").isFloat()
      check(req.body.addresses[i].geo.lat,     "Votre adresse n'est pas valide").isFloat()
      check(req.body.addresses[i].postalCode,  "Votre numéro postal n'est pas valide").isNumeric()
      ifCheck(req.body.addresses[i].floor,     "Votre numéro postal n'est pas valide").isAlphanumeric()
      check(req.body.addresses[i].streetAdress,"Votre adresse n'est pas valide").isText().len(10, 30)
      ifCheck(req.body.addresses[i].note,        "Votre note n'est pas valide").isText().len(10, 30)
      check(req.body.addresses[i].name,        "Votre nom d'adresse n'est pas valide").isText().len(10, 30)
    }
}

