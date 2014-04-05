
var debug = require('debug')('validate');
var assert = require("assert");


var validator=require('validator'),
    check = validator.check,
    sanitize = validator.sanitize;



var text=/^[a-zA-ZÀ-ÿ0-9',:;.!?$+"*ç%&°~#€^|\/\(\)=?`{}\[\]_\-\s\S]+$/,
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

//Create some aliases - may help code readability
// check for old version here https://github.com/chriso/validator.js/blob/0c5ced087434ed0b5623700955be18f24980dea0/validator.js
Wrapper.prototype.validate = Wrapper.prototype.check;
Wrapper.prototype.assert = Wrapper.prototype.check;

Wrapper.prototype.error = function(msg) {
    throw new Error(msg);
}

constructWrapper=function(name){
  return function(){
      if (!this.skip&&!validator[name](this.str)) {
        return this.error(this.msg);
    }
    return this;
  }
}

Wrapper.prototype.isEmail = constructWrapper('isEmail');
Wrapper.prototype.isText  = constructWrapper('isText');
Wrapper.prototype.isAlpha = constructWrapper('isAlpha');
Wrapper.prototype.isHexadecimal = constructWrapper('isHexadecimal');
Wrapper.prototype.isNumeric = constructWrapper('isNumeric');
Wrapper.prototype.isFloat = constructWrapper('isFloat');
Wrapper.prototype.isInt = constructWrapper('isInt');
Wrapper.prototype.isBoolean = constructWrapper('isBoolean');
Wrapper.prototype.isUrl = constructWrapper('isURL');
Wrapper.prototype.isSlug = constructWrapper('isSlug');
Wrapper.prototype.isAlphanumeric=constructWrapper('isAlphanumeric');

Wrapper.prototype.is = function(regex) {
  if (!this.skip&&!regex.test(this.str))
      return this.error(this.msg);
  return this;
}

Wrapper.prototype.len = function(min, max) {
  if (!this.skip&&(this.str.length < min)||(typeof max !== undefined && this.str.length > max)){
      return this.error(this.msg);
  }
  return this;
}

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


