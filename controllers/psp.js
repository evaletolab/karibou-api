
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    sm = require('sitemap'),
    db = require('mongoose'),
    http = require('http'),
    validate = require('./validate/validate'),
    postfinance =require('node-postfinance'),
    payment = require('../app/payment'),
    debug = require('debug')('api'),
    errorHelper = require('mongoose-error-helper').errorHelper;



//
// PSP callback /v1/psp/:token/webhook
// only used for online alias creation
// we can save POstfinance Card payment method one we get a valid webhook
// FIXME this should be in the postfinance module 
exports.psp=function(req,res){

  //
  // checks webhook config 
  if(!config.admin.webhook||!config.admin.webhook.secret){
    return res.send(401);
  }

  //
  // check webhook secret
  if(config.admin.webhook.secret!==req.params.token){
    return res.send(401);
  }

  debug("webhook payload ",req.body);

  // check action is createAlias
  if(!req.body.createAlias ||!req.body.ALIAS){
    return res.send(200);
  }


  //
  // validate SHA
  if(!payment.for(req.body.BRAND).isValidSha(req.body)){
    return res.send(400,"The calculated hash values and the transmitted hash values do not coincide.");
  }

  var alias=(req.body.user+req.body.BRAND.toLowerCase()).hash(), safePayment={}
  var month=parseInt(req.body.ED.substring(0,2),10)
  var year=parseInt(req.body.ED.substring(2,4))+2000;
  safePayment.alias=req.body.ALIAS.crypt();
  safePayment.type=req.body.BRAND.toLowerCase();
  safePayment.name=req.body.CN;
  safePayment.number=req.body.CARDNO;
  safePayment.expiry=month+'/'+year;
  safePayment.updated=Date.now();

  // add this payment in the order

  // Users.findOne({id: req.body.user}, function(err,user){
  //   if(err){
  //     return res.send(400,errorHelper(err))
  //   }
  //   if(!user){
  //     return res.send(400, "Utilisateur inconnu");
  //   }

  //   return user.addAndSavePayment(safePayment,function (err) {
  //     res.render('pspsuccess');
  //   })
  // });



}

//
// PSP append alias in user.payment[] 
exports.pspAlias=function(req,res){

  var user=req.user,
      hostname=req.hostname;
  //
  // prepare the card
  var postfinanceCard = {
    paymentMethod: 'postfinance card',
    email:user.email.address,
    firstName: user.name.givenName,
    lastName: user.name.familyName,
  };

  var card = new postfinance.Card(postfinanceCard);
  var alias=(user.id+card.issuer.toLowerCase()).hash()

  var options={
    alias:alias, 
    aliasUsage:'Karibou payment',
    title:'Enregistrement de votre carte chez Postfinance',
    bgcolor:'#F2F4F2',
    tp:"http://"+hostname+"/v1/psp/std",
    paramplus:'createAlias=true&user='+user.id,
  }

  // generate form
  card.publishForEcommerce(options,function(err,res) {
    if(err){
      return res.send(400,errorHelper(err))
    }
    res.json(res)
  });

}
expiry.pspCharge=function (req,res) {
  var user=req.user,
      hostname=req.hostname,
      amount=parseFloat(req.body.amount);

  //
  // prepare the card
  var postfinanceCard = {
    paymentMethod: 'postfinance card',
    email:user.email.address,
    firstName: user.name.givenName,
    lastName: user.name.familyName,
  };

  var card = new postfinance.Card(postfinanceCard);

  var options={
    amount:amount,
    title:'Charger de votre compte avec votre carte chez Postfinance',
    bgcolor:'#F2F4F2',
    tp:"http://"+hostname+"/v1/psp/std",
    paramplus:'transferWallet=true&user='+user.id,
  }

  // generate form
  card.publishForEcommerce(options,function(err,res) {
    if(err){
      return res.send(400,errorHelper(err))
    }
    res.json(res)
  });}


//
// empty PSP template 
exports.pspStd=function(req,res){
  res.render('pspstd');
}