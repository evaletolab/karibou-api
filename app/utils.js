

module.exports = function (app) {

  // export api
  // toto move this code from there
  String.prototype.hash=function hash(){
    var h=0,i,char;
    if (this.length===0){
      return h;
    }
    
    for (i=0;i<this.length;i++){
      char=this.charCodeAt(i);
      h=((h<<5)-h)+char;
      h=h & h;
    }
    return h;
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
