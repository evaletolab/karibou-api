

module.exports = function (app) {

  // simple hash function on 64bits
  String.prototype.hash=function hash(append){
    var more=append||''
    // return require('crypto').createHash('md5').update(this+more).digest("hex")
    return require('fnv-plus').hash(this+more, 64).dec()
  }   

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
  }

}
