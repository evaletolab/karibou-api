

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

    var code = str.substring(0, str.lastIndexOf(config.admin.padding));


    if(code){
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


    var code = str.substring(0, str.lastIndexOf(config.admin.padding) );
    if(code){
      return dc(code)
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
 

  //
  // give an array of days (in the form [0..6]) and return the ordered dates corresponding (starting from today)
  // Sun(0), Mon, tuesday, wednesday, thursday, Freeday, Saterday
  Date.dayToDates=function(days, offset, limit){
    var now=offset||new Date(), today=now.getDay(), h24=86400000, week=86400000*7, result=[], potential;    
    days=days||[];
    days=days.sort(); // sort days in a week

    //
    // starting from today
    days.forEach(function (day,i) {
      if((day-today)>=0) {
        result.push(new Date(now.getTime()+(day-today)*h24));
      }
    });

    // this is splitted in 2 loops to make the list ordered!
    // going to next week  ()
    days.forEach(function (day) {
      if((day-today)<0) {
        potential=new Date(now.getTime()+(day-today)*h24+week);
        if(!limit||potential<limit){
          result.push(potential);
        }
      }
    });

    return result;
  };

  Date.prototype.toYYYYMMDD=function() {
    return ''+this.getFullYear()+this.getMonth()+this.getDate();
  }

  Date.prototype.tomorrow=function() {
    return this.plusDays(1);
  }

  Date.prototype.plusDays=function(nb) {
    var plus=new Date(this);
    plus.setDate(this.getDate()+nb);
    return plus;
  }

  //
  // simple test : this in [d1,d2[
  Date.prototype.in=function(d1,d2) {
    return (this>=d1&&this<d2)
  }
  
  //
  // Compute the next potential shipping day. 
  // It depends on the hours needed to harvest/prepare a placed order
  Date.potentialShippingDay=function(){
    var now=new Date(), 
        potential=new Date(now.getTime()+3600000*config.shared.order.timelimit);

    //
    // timelimitH is hour limit to place an order
    if (potential.getHours()>config.shared.order.timelimitH){
      potential.setHours(0,0,0,0);
      return potential.plusDays(1);
    }
    potential.setHours(0,0,0,0);

    // next date depends on the hours needed to prepare a placed order
    return potential;        

  };

  Date.potentialShippingWeek=function(){
    return Date.dayToDates(
        config.shared.order.weekdays,
        Date.potentialShippingDay()
      );
  };

  //  
  // the current shipping day is short date for the placed orders
  Date.currentShippingDay=function(){
    return this.dayToDates(config.shared.order.weekdays)[0];
  };

  //
  // the next shipping day
  Date.nextShippingDay=function() {
    var next=Date.dayToDates(
          config.shared.order.weekdays,
          Date.potentialShippingDay()
        ),noshipping;


    //
    // no closed date
    if(!config.shared.noshipping||!config.shared.noshipping.length){
      return next[0];
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    for (var j = 0; j <next.length; j++) {
      for (var i = 0; i<config.shared.noshipping.length; i++) {
        noshipping=config.shared.noshipping[i];
        if(!next[j].in(noshipping.from,noshipping.to)) return next[j];
      }
    }

    // else 
    // after 7 days we cant order anyway!
    return;
  }

  //
  // a full week of available shipping days 
  // limit to nb days (default is <7) 
  Date.fullWeekShippingDays=function(limit) {
    var next=Date.potentialShippingWeek(), lst=[], find=false, today=new Date();

    //
    // default date limit is defined by
    limit=limit||config.shared.order.uncapturedTimeLimit;
    limit=limit&&today.plusDays(limit+0);

    function format(lst) {
      //
      // sorting dates
      lst=lst.sort(function(a,b){
        return a.getTime() - b.getTime();
      });

      //
      // limit lenght of a week
      return lst.filter(function(date) {
        return (!limit||date<limit);
      })

    }


    //
    // no closed date
    if(!config.shared.noshipping||!config.shared.noshipping.length){
      return format(next);
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    next.forEach(function(shippingday) {
      find=_.find(config.shared.noshipping,function(noshipping) {
        return shippingday.in(noshipping.from,noshipping.to);
      });
      if(!find) lst.push(shippingday)
    });




    return format(lst);
  }


  //
  // label alphanum sort for this case "2000.10"
  Array.prototype.sortSeparatedAlphaNum=function (separator) {
    separator=separator||'.';

    return this.sort(function (a,b) {
      var aA = a.split(separator);
      var bA = b.split(separator);
      // left part
      if(parseInt(aA[0])>parseInt(bA[0])){
        return 1;
      }else
      if(parseInt(aA[0])<parseInt(bA[0])){
        return -1;
      }
      //right part
      if(parseInt(aA[1])>parseInt(bA[1])){
        return 1;
      }else
      if(parseInt(aA[1])<parseInt(bA[1])){
        return -1;
      }
      return 0;
    });
  };
  Object.defineProperty(Array.prototype, "sortSeparatedAlphaNum", { enumerable: false });

  //
  // simple alpha num sorting
  Array.prototype.sortAlphaNum=function () {
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;
    return this.sort(function (a,b) {
      var aA = a.replace(reA, "");
      var bA = b.replace(reA, "");
      if(aA === bA) {
          var aN = parseInt(a.replace(reN, ""), 10);
          var bN = parseInt(b.replace(reN, ""), 10);
          return aN === bN ? 0 : aN > bN ? 1 : -1;
      } else {
          return aA > bA ? 1 : -1;
      }
    });
  };

  Object.defineProperty(Array.prototype, "sortAlphaNum", { enumerable: false });

}

