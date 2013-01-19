
var debug = require('debug')('validate');
var assert = require("assert");

var validate = require('mongoose-validate');
  

 // validate URL
 validate.url = function (value) {
   try {
     check(value).len(10, 200).regex(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
   } catch(err) {
     return false;
   }
   return true;
 };
 
 
 // validate postal code
 validate.postal = function (value) {
   try {
     check(value).isAlpha();   
   } catch(err) {
     return false;
   }
   return true;
 };

module.exports =validate;


