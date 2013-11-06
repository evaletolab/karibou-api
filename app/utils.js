

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

}
