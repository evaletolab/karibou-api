var db = require('mongoose'),
    validator = require('../../app/validator'),
    check = validator.check,
    ifCheck = validator.ifCheck;


exports.check   = check;
exports.ifCheck = ifCheck;

var user_address = exports.address =  function(address){
      check(address.name,        "Le nom ou le prénom de l'adresse n'est pas valide").isText().len(2, 100)
      check(address.streetAdress,"La rue de votre adresse n'est pas valide").isText().len(4, 200)
      check(address.floor,     "L'étage n'est pas valide").isText().len(1, 50)
      check(address.postalCode,  "Votre numéro postal n'est pas valide").isNumeric()

      ifCheck(address.note,        "Votre note n'est pas valide").isText().len(0, 200)
      ifCheck(address.region,    "La région n'est pas valide").isText().len(2, 100)
      ifCheck(address.primary,   "Ooops votre adresse n'est pas valide").isBoolean()
      if(address.geo){
        check(address.geo.lng,     "Erreur de données de geolocalisation 1").isFloat()
        check(address.geo.lat,     "Erreur de données de geolocalisation 2").isFloat()        
      }
}

/**
 *
 */
var user= exports.user = function(u, lean){

    if(u.email){
      ifCheck(u.email.address,   "Votre adresse email n'est pas valide").len(6, 64).isEmail();
    }

    if(u.name){
      ifCheck(u.name.familyName, "Votre nom de famille n'est pas valide").len(2, 100).isText();
      ifCheck(u.name.givenName,  "Votre prénom n'est pas valide").len(2, 100).isText();
    }

    if(!lean && !u.phoneNumbers.length){
      throw new Error("Vous devez définir au moins un téléphone");
    }

    for( var i in u.phoneNumbers){
      check(u.phoneNumbers[i].what,   "Votre libélé de téléphone n'est pas valide").isText().len(4, 30)
      check(u.phoneNumbers[i].number, "Votre numéro téléphone n'est pas valide").isText().len(10, 30)
    }

    for( var i in u.addresses){
      user_address(u.addresses[i])
    }

}

exports.payment=function(payment, alias){
  check(alias,  "Ce mode de paiement est inconnu").isText().len(6,256)
  check(payment.name,  "Le titulaire de la carte n'est pas valide").isText().len(4,50)
  check(payment.expiry,  "La date de validité de la carte n'est pas correcte").isText().len(4,10)
  // type is computed by number
  check(payment.issuer,  "Le type de carte n'est pas valide").isText().len(3,50)
  ifCheck(payment.number,  "Le numéro de la carte n'est pas valide").isText().len(4,50)
  ifCheck(payment.csc,  "Le code de vérification de la carte n'est pas valide").isText().len(0,5)

}


exports.password=function(auth){
  var len=config.shop.system.password.len;
  check(auth.new,"Votre mot de passe doit contenir au moins "+len+" caractères").len(len, 64);
  check(auth.email,"Entrez une adresse mail valide").isEmail();
}

exports.authenticate=function(auth){
  var len=config.shop.system.password.len;
  check(auth.password,"Votre mot de passe doit contenir au moins "+len+" caractères").len(len, 64);
  check(auth.email,"Entrez une adresse mail valide").isEmail();
  check(auth.provider,"Erreur interne de format [provider]").len(3, 64);
}

exports.register=function(auth){
  var len=config.shop.system.password.len;
  check(auth.password,"Votre mot de passe doit contenir au moins "+len+" caractères").len(len, 64);
  check(auth.email,"Entrez une adresse mail valide").isEmail();
  check(auth.lastname,"Le format du nom doit contenir au moins 2 caractères").isText().len(2, 64);
  check(auth.firstname,"Le format du prénom doit contenir au moins 2 caractères").isText().len(2, 64);
}

/**
 *
 */
exports.product = function(req){
    if (!req.body)return;
    if(req.body.title) check(req.body.title,"Le nom n'est pas valide").len(3, 64).isText();


    if(req.body.details){
      check(req.body.details.description,"Le description doit contenir au max 1'200 caractères").len(3, 1200).isText();
      req.body.details.bio && check(req.body.details.bio,"Erreur system p1").isBoolean();
      req.body.details.homemade && check(req.body.details.homemade,"Erreur system p2").isBoolean();
      req.body.details.natural && check(req.body.details.natural,"Erreur system p3").isBoolean();
      req.body.details.local && check(req.body.details.local,"Erreur system p4").isBoolean();
      req.body.details.cold && check(req.body.details.cold,"Erreur system p5").isBoolean();

    }else{
      throw new Error("Vous devez définir une description de 3 à 1'000 caractères");
    }

    if(req.body.pricing){
      check(req.body.pricing.price, "La valeur du prix n'est pas correct").isFloat();
      req.body.pricing.discount&&check(req.body.pricing.discount, "Entrez une promotion valide").isFloat();

      check(req.body.pricing.stock, "Entrez une valeur de stock valide").isInt();
      check(req.body.pricing.part, "La valeur d'une portion doit contenir entre 2 et 10 caractères").len(2, 10);

      if(req.body.attributes&&req.body.attributes.discount&&!req.body.pricing.discount){
        throw new Error("Vous avez activé la promotion sans définir le prix");  
      }
    }else{
      throw new Error("Vous devez définir un prix");
    }

    if (req.body.photo){
      req.body.photo.bg && check(req.body.photo.bg,"Erreur system p6").len(6, 164).isImgUrl();
      req.body.photo.fg && check(req.body.photo.fg,"Erreur system p7").len(6, 164).isImgUrl();
      req.body.photo.owner && check(req.body.photo.owner,"Erreur system p8").len(6, 164).isImgUrl();
    }else{
      throw new Error("Vous devez définir une photo");
    }

    if (req.body.quantity &&req.body.quantity.display){
      check(req.body.quantity.display).isBoolean();
      check(req.body.quantity.comment,"Vous devez définir une description des quantitées de 3 à 100 caractères").len(6, 100).isText();
    }

    if (req.body.shelflife &&req.body.shelflife.display ){
      check(req.body.shelflife.display).isBoolean();
      check(req.body.shelflife.comment,"Vous devez définir un text de péremption de 3 à 100 caractères").len(6, 100).isText();
    }


    if (req.body.available){
      req.body.available.active && check(req.body.available.active).isBoolean();
      req.body.available.comment && check(req.body.available.comment,"Le format du commentaire n'est pas valide").isText();
    }


    if (req.body.info){
      req.body.info.active && check(req.body.info.active).isBoolean();
      req.body.info.comment && check(req.body.info.comment,"Vous devez définir un commentaire de 3 à 500 caractères").len(6, 500).isText();
    }

    for (var i in req.body.faq){
      check(req.body.faq[i].q,"Vous devez écrire un question qui doit contenir entre 3 et 150 caractères").len(3, 150).isText();
      check(req.body.faq[i].a,"Vous devez écrire un réponse qui doit contenir entre 3 et 1'000 caractères").len(3, 1000).isText()
    }

}

var order_items = exports.orderItems = function(items, update){
  for (var i in items){
    check(items[i].sku).isNumeric()
    check(items[i].title,       "Le description doit contenir entre 6 et 500 caractères").isText().len(3, 500);
    if(update!==true){
      check(items[i].categories,  "La catégorie doit contenir entre 6 et 200 caractères").isText().len(3, 200);
      check(items[i].vendor,      "Le vendeur doit contenir entre 3 et 200 caractères").isText().len(3, 200);
      check(items[i].quantity,    "La quantité n'est pas valable").isNumeric()
      check(items[i].price,       "Le prix n'est pas valable").isFloat()
      check(items[i].part,        "Vous devez écrire une portion du produit qui doit être entre 1 et 50 caractères").isText().len(1, 50);
    }
    ifCheck(items[i].note,        "Le commentaire doit contenir entre 1 et 500 caractères").isText().len(0, 500);
    check(items[i].finalprice,  "Le prix final n'est pas valide").isFloat()
  }
}
/**
 *
 */
exports.order = function(order){
  if (!order)return;

  order_items(order.items)

  // if(order.customer){
  //   user(order.customer)
  // }

  if(order.shipping){
    user_address(order.shipping)
    check(order.shipping.when,"La commande doit contenir une date de livraison").isDate();
  }

  // validate alias is done later on the process
   //check(order.payment.alias,  "L'alias de la carte n'est pas valide").isText().len(4,256)
}

exports.orderFind = function(req){
}

exports.shop=function(shop){
    if (!shop)return;

    if(shop.name) check(shop.name,"Le nom doit contenir entre 3 et 60 caractères").len(3, 60).isText()
    if(shop.description){
      check(shop.description,"La description doit contenir entre 3 et 500 caractères").len(3, 500).isText()
      // shop.description=sanitize(shop.description,"La description n'est pas valide").xss();
    }

    if(shop.url) check(shop.url,"Erreur system p9").len(6, 164).isImgUrl();

    if (shop.photo){
      shop.photo.bg && check(shop.photo.bg,"Erreur system p9").len(6, 164).isImgUrl();
      shop.photo.fg && check(shop.photo.fg,"Erreur system p9").len(6, 164).isImgUrl();
      shop.photo.owner && check(shop.photo.owner,"Erreur system p9").len(6, 164).isImgUrl();
    }

    if (shop.details){
      shop.details.bio && check(shop.details.bio).isBoolean();
      shop.details.gluten && check(shop.details.gluten).isBoolean();
      shop.details.lactose && check(shop.details.lactose).isBoolean();
      shop.details.local && check(shop.details.local).isBoolean();
    }

    for (var i in shop.faq){
      check(shop.faq[i].q,"La question doit contenir entre 3 et 150 caractères").len(3, 150).isText();
      check(shop.faq[i].a,"La réponse doit contenir entre 3 et 400 caractères").len(3, 400).isText();
    }

    if (shop.available){
      shop.available.active && check(shop.available.active,"Erreur system p10").isBoolean();
      shop.available.comment && check(shop.available.comment,"Le commentaire doit contenir entre 6 et 264 caractères").len(6, 264).isText();

      //      
      // date should be mentioned here
      if(shop.available.active===true){
        check(shop.available.active.from,"La date de fermeture doit être mentionnée").isDate();        
        check(shop.available.active.to,"La date de réouverture doit être mentionnée").isDate();        
      }
    }

    if (shop.info){
      shop.info.active && check(shop.info.active).isBoolean();
      shop.info.comment && check(shop.info.comment,"Le format du commentaire doit contenir entre 6 et 264 caractères").len(6, 264).isText();
    }

    if(!shop.address && !shop.marketplace){
      throw new Error("Vous devez définir au moins une adresse de collecte");
    }

    if(shop.address){

      ifCheck(shop.address.depository,"Le lieu de collecte de vos produits doit contenir entre 4 et 150 caractères").isText().len(4,150)
      check(shop.address.name,"Le nom de votre adresse doit contenir entre 4 et 100 caractères").isText().len(4,100)
      check(shop.address.floor,"L'étage de votre adresse doit contenir entre 1 et 10 caractères").isText().len(1,10)
      check(shop.address.phone,"Le téléphone de votre adresse doit contenir entre 4 et 100 caractères").isText().len(4,100)
      check(shop.address.region,"La région de votre adresse doit contenir entre 1 et 100 caractères").isText().len(4,100)
      check(shop.address.postalCode,"Le code postal de votre adresse n'est pas valide").isNumeric()
    }
    for (var i in shop.marketplace){
        check(shop.marketplace[i],"Votre point de collect n'est pas valide").isText().len(4,45)
    }



}
