
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    db = require('mongoose'),
    http = require('http'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    bank = require('karibou-wallet'),
    debug = require('debug')('api'),
    errorHelper = require('mongoose-error-helper').errorHelper;


exports.ensureAdminOrOwner=function (req, res, next) {
    
  //
  // ensure auth
  if (!req.isAuthenticated()) { 
      return res.send(401); 
  }
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(alias&&parseInt(alias.id)===req.user.id){
    return next();
  }

  // if not admin, 
  if (!req.user.isAdmin()) { 
      return res.send(401,"Cette fonctionalité est réservée a un administrateur ou au propriétaire");  
  }
  
  return next();
}

// TODO giftcode should be outside this file
exports.listWallet=function (req,res) {

  bank.wallet.retrieveAllGift().then(function (wallets) {
    res.json(wallets);
  }).then(undefined, function (error) {
    return res.send(400,errorHelper(err))
  });

};
exports.registerGiftcode=function (req,res) {
  try{
    validate.registerWallet(req.body)
  }catch(err){
    return res.send(400, err.message);
  }
  
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(!alias){
    res.send(400,"Wrong wallet id");
  }
  var card={
    name:req.body.name,
    number:req.body.number
  };

  bank.transfer.registerGiftcode(alias.wallet_id,card).then(function (wallet) {
    res.json(wallet)
  }).then(undefined,function (error) {
    res.send(400,error.message||error);
  })

}

exports.getWallet=function (req,res) {
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(!alias){
    req.send(400,"Wrong wallet id");
  }

  //
  // easy 
  bank.wallet.retrieve(alias.wallet_id).then(function (wallet) {
    res.json(wallet);
  }).then(undefined, function (error) {
    res.send(400,error.message||error);
  });

};

exports.updateWallet=function (req,res) {
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user),giftcard;
  if(!alias){
    return res.send(400,"Wrong wallet id");
  }
  res.send(400,'Not implemented');
};

exports.createWallet=function (req,res) {
  try{
    validate.createWallet(req.body);
  }catch(err){
    return res.send(400, err.message);
  }

  var alias=req.body.payment.alias;
  payment.for(req.body.payment.issuer).charge({
    amount: Math.round(req.body.amount),
    description: "#giftcard of "+req.body.amount+" for "+req.user.email.address
  },alias,req.user).then(function(charge) {
    //
    // create the giftcode
    var wallet={
      id:req.user.id,
      email:req.user.email.address,
      description:'Créer une carte kdo karibou',
      giftcode:true    
    };
    return bank.wallet.create(wallet);
  }).then(function (wallet) {
    //
    // save the wallet reference
    giftcard=wallet;
    var transfer={
      amount:Math.round(req.body.amount*100),
      description:'Crédit de '+req.body.amount+' fr',
      type:'credit'
    };
    return bank.transfer.create(wallet.wid,transfer);
  }).then(function (transfer,w) {
    var wallet=giftcard;
    //
    // send mail
    var body=_.extend({},req.body);
    var content={wallet:wallet,transfer:transfer,user:req.user,query:body};
    // bus.emit('sendmail',wallet.email,'Votre carte cadeau Karibou ',content,'wallet-send');
    delete body.payment;
    bus.emit('activity.create',req.user,{type:'Wallets',key:'wid',id:wallet.wid},wallet.card);
    return bank.wallet.retrieve(wallet.wid)
  }).then(function (wallet) {
    return res.json(wallet);    
  }
  ).then(undefined, function (err) {
    return res.send(400,err.message||errorHelper(err))
  });

};

