
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

exports.listWallet=function (req,res) {
  var filters={};
  if(!req.user.isAdmin()){
    filters.id=req.user.id;
  }else
  if(req.query.id){
    filters.id=req.query.id;
  }

  bank.wallet.retrieveAllGift(filters).then(function (wallets) {
    res.json(wallets);
  }).then(undefined, function (error) {
    return res.send(400,error.message||error);
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
    return res.send(400,error.message||error);
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

exports.getGiftWallet=function (req,res) {

  if(!req.params.card){
    return res.send(400,"Hoho, missing data here!")
  }


  //
  // easy 
  bank.wallet.retrieveOneGift(req.params.card).then(function (wallet) {
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
  var giftcard;
  var alias=req.body.payment.alias;
  var amount=parseFloat(req.body.amount);
  var charged=0;

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
      amount:Math.round(amount*100),
      description:'Crédit de '+amount+' fr',
      type:'credit'
    };
    return bank.transfer.create(wallet.wid,transfer);
  }).then(function (transfer,w) {
    var wallet=giftcard;
    return bank.wallet.retrieve(wallet.wid)
  }).then(function (wallet) {
    //
    // send mail
    var body=_.extend({},req.body);
    var content={
      wallet:wallet,
      user:req.user,
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
    return res.send(400,err.message||errorHelper(err))
  });

};


exports.transferWallet=function (req,res) {
  try{
    validate.createWallet(req.body);
  }catch(err){
    return res.send(400, err.message);
  }

  var userWallet;
  var wid=req.params.wid;
  var amount=parseFloat(req.body.amount);
  bank.wallet.retrieve(wid).then(function (wallet) {
    //
    // save the wallet reference    
    userWallet=wallet;
    var transfer={
      amount:Math.round(amount*100),
      description:'Crédit de '+req.body.amount+' fr',
      type:'credit'
    };
    return bank.transfer.create(wallet.wid,transfer);
  }).then(function (transfer,w) {
    return bank.wallet.retrieve(userWallet.wid)
  }).then(function (wallet) {
    //
    // send mail
    bus.emit('activity.update',req.user,{type:'Wallets',key:'wid',id:wallet.wid},wallet.card);

    return res.json(wallet);    
  }
  ).then(undefined, function (err) {
    return res.send(400,err.message||errorHelper(err))
  });

};
