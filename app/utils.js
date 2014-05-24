

module.exports = function (app) {

  // export api
  // djb2 algo
  // http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
  String.prototype.hash=function hash(){
    var hash = 0;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char; /* hash * 31 + c */
    }
    return hash;
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
