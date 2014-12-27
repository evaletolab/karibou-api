

module.exports = function (app) {

  // simple hash function on 64bits
  String.prototype.hash=function hash(append){
    var more=append||''
    // return require('crypto').createHash('md5').update(this+more).digest("hex")
    return require('fnv-plus').hash(this.valueOf()+more).dec()
  };

  String.prototype.slug=function () {
    var str = this.
                replace(/^\s+|\s+$/g, '').
                toLowerCase(); // trim/lower
    
    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
      str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

    return str;
  };


  String.prototype.crypt=function(){
    if(!config.admin.secret)
      throw new Error("Oopps, secret key not available")


    var str=this.valueOf(), cipher=require('crypto').
              createCipher('aes-256-cbc',config.admin.secret);

    var blocks=str.split(config.admin.padding);


    if(blocks.length==2){
      return str;
    }              

    var out = cipher.update(str, 'utf8', 'hex');
    return out+cipher.final('hex')+config.admin.padding

  };


  String.prototype.decrypt=function(){
    if(!config.admin.secret)
      throw new Error("Oopps, secret key not available")

    var decipher=require('crypto').
              createDecipher('aes-256-cbc', config.admin.secret),
        str=this.valueOf();

    function dc(str){
      var tokenStr=decipher.update(str, 'hex', 'utf8');        
      return tokenStr+decipher.final('utf8');      
    }


    var blocks=str.split(config.admin.padding);

    if(blocks.length==2){
      return dc(blocks[0])
    }
    
    return dc(str);
  };


  // Date
  // Month is 1 based
  Date.prototype.daysInMonth=function(month) {
    //var y=this.getFullYear(), m=(month||this.getMonth())
    //return /8|3|5|10/.test(m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;

    return new Date(this.getFullYear(), (month||this.getMonth())+1, 0).getDate();
  };

  // the number of months in the difference
  // http://stackoverflow.com/questions/2536379/difference-in-months-between-two-dates-in-javascript
  Date.prototype.monthDiff=function(d1) {
    var months;
    months = (d1.getFullYear() - this.getFullYear()) * 12;
    months -= this.getMonth() + 1;
    months += d1.getMonth();
    return months <= 0 ? 0 : months;
  };
  
}

