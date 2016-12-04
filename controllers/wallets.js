
/*
 * API introspection
 */
var _ = require('underscore'),
    bus=require('../app/bus'),
    db = require('mongoose'),
    assert = require("assert"),
    http = require('http'),
    validate = require('./validate/validate'),
    payment = require('../app/payment'),
    bank = require('karibou-wallet')(),
    debug = require('debug')('api'),
    errorHelper = require('mongoose-error-helper').errorHelper;


exports.ensureAdminOrOwner=function (req, res, next) {
    
  //
  // ensure auth
  if (!req.isAuthenticated()) { 
      return res.sendStatus(401); 
  }
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(alias&&parseInt(alias.id)===req.user.id){
    return next();
  }

  // if not admin, 
  if (!req.user.isAdmin()) { 
      return res.status(401).send("Cette fonctionalité est réservée a un administrateur ou au propriétaire");  
  }
  
  return next();
}

exports.listGiftWallet=function (req,res) {
  var filters={};
  if(!req.user.isAdmin()){
    filters.id=req.user.id;
  }else
  if(req.query.id){
    filters.id=req.query.id;
  }
  if(req.query.email){
    filters.email=req.query.email+'';
  }

  if(req.query.gt){
    filters.gt=parseFloat(req.query.gt)
  }
  if(req.query.lt){
    filters.lt=parseFloat(req.query.lt)
  }


  bank.wallet.retrieveAllGift(filters).then(function (wallets) {
    res.json(wallets);
  }).then(undefined, function (error) {
    return res.status(400).send(error.message||error);
  });

};

exports.listAllWallet=function (req,res) {
  var filters={};
  if(!req.user.isAdmin()){
    filters.id=req.user.id;
  }else
  if(req.query.id){
    filters.id=req.query.id;
  }
  if(req.query.email){
    filters.email=req.query.email+'';
  }

  if(req.query.gt){
    filters.gt=parseFloat(req.query.gt)
  }
  if(req.query.lt){
    filters.lt=parseFloat(req.query.lt)
  }


  bank.wallet.retrieveAll(filters).then(function (wallets) {
    res.json(wallets);
  }).then(undefined, function (error) {
    return res.status(400).send(error.message||error);
  });

};

exports.countGiftcode=function (req,res) {
  // retrieve all giftcards
  bank.wallet.retrieveAllGift({}).then(function (wallets) {
    var amount=0, offset=config.payment.karibou.offset||0;
    wallets.forEach(function (wallet) {
      amount+=wallet.transfers[wallet.transfers.length-1].amount;
    });

    res.json({amount:amount,quatity:wallets.length+offset});
  }).then(undefined, function (error) {
    return res.status(400).send(error.message||error);
  });

};



exports.registerGiftcode=function (req,res) {
  try{
    validate.registerWallet(req.body)
  }catch(err){
    return res.status(400).send( err.message);
  }

  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(!alias){
    res.status(400).send("Wrong wallet id");
  }
  var card={
    name:req.body.name,
    number:req.body.number.trim()
  };

  bank.transfer.registerGiftcode(alias.wallet_id,card).then(function (wallet) {
    bus.emit('system.message',"[karibou-wallet] load giftcard "+card.number,
        {transaction:wallet.card,balance:wallet.balance,what:'transfer'});
    bus.emit('activity.update',req.user,{type:'Wallets',key:'wid',id:wallet.wid},
        {transaction:wallet.card,balance:wallet.balance,what:'transfer'});
    res.json(wallet)
  }).then(undefined,function (error) {
    bus.emit('system.message',"[karibou-wallet] error giftcard "+card.number,{error:error,user:req.user.email});
    res.status(400).send(error.message||error);
  })

}

exports.getWallet=function (req,res) {
  var alias=payment.for('wallet').decodeAlias(req.params.alias,req.user);
  if(!alias){
    res.status(400).send("Wrong wallet id");
  }

  //
  // easy 
  bank.wallet.retrieve(alias.wallet_id).then(function (wallet) {
    res.json(wallet);
  }).then(undefined, function (error) {
    res.status(400).send(error.message||error);
  });

};

exports.getGiftWallet=function (req,res) {

  if(!req.params.card){
    return res.status(400).send("Hoho, missing data here!")
  }


  //
  // easy 
  bank.wallet.retrieveOneGift(req.params.card).then(function (wallet) {
    res.json(wallet);
  }).then(undefined, function (error) {
    res.status(400).send(error.message||error);
  });

};


exports.createWallet=function (req,res) {
  try{
    validate.createWallet(req.body);
  }catch(err){
    return res.status(400).send( err.message);
  }
  var giftcard;
  var alias=req.body.payment.alias;
  var amount=parseFloat(req.body.amount);
  var charged=0;
  var stripeCharge={};

  //
  // 
  var print=(req.body.print)?(1.00):0.0;

  payment.for(req.body.payment.issuer).charge({
    amount: payment.fees(req.body.payment.issuer,amount+print)+(amount+print),
    description: "#giftcard of "+req.body.amount+" for "+req.user.email.address
  },alias,req.user).then(function(charge) {
    //
    // payment fees makes amout bigger
    assert((charge.amount/100)>=(amount+print));
    charged=charge.amount;
    _.extend(stripeCharge,charge);
    //
    // create the giftcode
    var wallet={
      id:req.user.id,
      email:req.user.email.address,
      description:'Carte cadeau karibou.ch',
      giftcode:true    
    };
    return bank.wallet.create(wallet);
  }).then(function (wallet) {
    //
    // save the wallet reference    
    giftcard=wallet;
    var transfer={
      amount:Math.round(amount*100),
      description:'Crédit de '+amount+' fr',
      refid:stripeCharge.id,
      type:'credit'
    };
    return bank.transfer.create(wallet.wid,transfer,{account:'karibou.ch',name:'stripe'});
  }).then(function (transfer,w) {
    return bank.wallet.retrieve(giftcard.wid)
  }).then(function (wallet) {
    //
    // send mail
    var body=_.extend({},req.body);
    var content={
      wallet:wallet,
      user:req.user.toObject(),
      query:body,
      origin:req.header('Origin')||config.mail.origin,
      withHtml:true
    };
    bus.emit('sendmail',wallet.email,'Votre carte cadeau Karibou ',content,'wallet-new');
    bus.emit('activity.create',req.user,{type:'Wallets',key:'wid',id:wallet.wid},wallet.card);
    //
    // this makes test happy
    wallet._charged=charged;

    return res.json(wallet);    
  }
  ).then(undefined, function (err) {
    return res.status(400).send(err.message||errorHelper(err))
  });

};



exports.updateBANK=function (req,res) {
  // req.params.wid
  // update.name as str
  // update.external_account => ['bic','name','address1','address2','iban']


  var wid=decodeURIComponent(req.params.wid);
  bank.wallet.updateBank(wid,req.body).then(function (wallet) {
    res.json(wallet);
  }).then(undefined, function (err) {
    return res.status(400).send(err.message||errorHelper(err))
  });

};

exports.updateExpiry=function (req,res) {
  // req.params.wid
  // req.body.expiry => expiry MM/YYYY

  var wid=decodeURIComponent(req.params.wid);
  bank.wallet.updateExpiry(wid,req.body.expiry).then(function (wallet) {
    bus.emit('activity.update',req.user,{type:'Wallets',key:'wid',id:wid},req.body);
    res.json(wallet);
  }).then(undefined, function (err) {
    bus.emit('activity.error',req.user,{type:'Wallets',key:'wid',id:wid},{expiry:req.body.expiry,error:err});
    return res.status(400).send(err.message||errorHelper(err))
  });

};



exports.creditWallet=function (req,res) {
  try{
    validate.creditWallet(req.body);
  }catch(err){
    return res.status(400).send( err.message);
  }

  var wid=decodeURIComponent(req.params.wid);
  var amount=parseFloat(req.body.amount);

  //
  // checking wallet owner
  bank.wallet.retrieve(wid).then(function (wallet) {

    //
    // check transfer wallet.id === req.body.id

    var transfer={
      amount:Math.round(amount*100),
      description:req.body.description,
      refid:req.body.refid,
      type:req.body.type,
    };

    var bank_tr={
      iban:req.body.bank.iban,
      bic:req.body.bank.bic,
      account:req.body.bank.account,
      sic:req.body.bank.sic,
      name:req.body.bank.name
    };



    return bank.transfer.create(wid,transfer,bank_tr);
  }).then(function (transfer,wallet ) {

    bus.emit('activity.update',req.user,{type:'Wallets',key:'wid',id:wallet.wid},wallet.card);

    return res.json(wallet);    
  }
  ).then(undefined, function (err) {
    //bus.emit('activity.error',req.user,{type:'Wallets',key:'wid'},err);
    return res.status(400).send(err.message||errorHelper(err))
  });

};
