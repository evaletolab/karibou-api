
var debug = require('debug')('validate');
var assert = require("assert");


var validator=require('validator'),
    check = validator.check,
    sanitize = validator.sanitize;



var text=/^[a-zA-ZÀ-ÿ0-9',:;.!?$+"*ç%&°~#€^|\/\(\)=?`{}\[\]_\-\s\S]*$/,
    slug=/^[a-z0-9-]+$/;


//
// validate text
validator.extend('isText', function (str) {
    return text.test(str)
});

//
// validate boolean
validator.extend('isBoolean', function (str) {
    return /^(true|false)$/.test(str)
});

//
// validate slug
validator.extend('isSlug', function (str) {
    return slug.test(str)
});

//
// validate image url
validator.extend('isImgUrl', function (str) {
    // var start=str.indexOf('http')
    return validator.isText(str)
});

/**
 * wrapp validator function in object
 * https://github.com/ctavan/express-validator
 */
var Wrapper = function() {}

Wrapper.prototype.check = function(str, fail_msg) {
  if(typeof( str ) === 'undefined' || str === null || (isNaN(str) && str.length === undefined)){
      this.error(fail_msg)
  }
   this.skip=false;
   this.str =  str+'';
   this.msg = fail_msg;
   this._errors = this._errors || [];
   return this;
}

Wrapper.prototype.ifCheck = function(str, fail_msg) {
  if(typeof( str ) === 'undefined' || str === null || (isNaN(str) && str.length === undefined)){
    this.skip=true;
    return this;
  }
  return this.check(str,fail_msg)  
}

// check for old version here https://github.com/chriso/validator.js/blob/0c5ced087434ed0b5623700955be18f24980dea0/validator.js

Wrapper.prototype.error = function(msg) {
    throw new Error(msg);
}

constructWrapper=function(name,defmsg){
  return function(){
      var args=[this.str];for(var i in arguments){
        args.push(arguments[i])
      }
      if (!this.skip&&!validator[name].apply(this,args)) {
        //if(defmsg)this.msg=this.msg.replace('%msg',defmsg)
        return this.error(this.msg);
    }
    return this;
  }
}

Wrapper.prototype.isEmail = constructWrapper('isEmail');
Wrapper.prototype.isDate = constructWrapper('isDate');
Wrapper.prototype.isText  = constructWrapper('isText');
Wrapper.prototype.isAlpha = constructWrapper('isAlpha');
Wrapper.prototype.isHexadecimal = constructWrapper('isHexadecimal');
Wrapper.prototype.isNumeric = constructWrapper('isNumeric');
Wrapper.prototype.isFloat = constructWrapper('isFloat');
Wrapper.prototype.isInt = constructWrapper('isInt');
Wrapper.prototype.isBoolean = constructWrapper('isBoolean');
Wrapper.prototype.isUrl = constructWrapper('isURL');
Wrapper.prototype.isImgUrl = constructWrapper('isImgUrl');
Wrapper.prototype.isSlug = constructWrapper('isSlug');
Wrapper.prototype.isAlphanumeric=constructWrapper('isAlphanumeric');
Wrapper.prototype.is=constructWrapper('matches');
Wrapper.prototype.len=constructWrapper('isLength');


var inline = new Wrapper();


// export check
exports.check = function(str, fail_msg) {
  return inline.check(str, fail_msg);
}

// export conditional check
exports.ifCheck = function(str, fail_msg) {
  return inline.ifCheck(str, fail_msg);
}

// export validator
exports.validator = validator;


