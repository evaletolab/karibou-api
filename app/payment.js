var util = require("util");
var events = require("events");
var postfinance =require('node-postfinance')
var settings={}

settings.allowMultipleSetOption = false;
settings.sandbox = config.payment.postfinance.sandbox||true; 
settings.enabled = config.payment.postfinance.enabled||false; 
settings.debug = config.payment.postfinance.debug||false; 
settings.pspid = config.payment.postfinance.pspid;
settings.apiUser=config.payment.postfinance.apiUser;
settings.apiPassword = config.payment.postfinance.apiPassword;
settings.shaSecret = config.payment.postfinance.shaSecret;


postfinance.configure(settings);

module.exports=postfinance
