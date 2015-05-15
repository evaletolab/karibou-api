var debug = require('debug')('orders');
var assert = require("assert");
var _=require('underscore');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;




exports.print=function(order){
  var self=order
  console.log("-- OID    ", self.oid);
  console.log("---      shipped       ",  self.shipping.shipped);
  console.log("---      shipping.when ",  self.shipping.when);
  console.log("---      payment       ",  self.payment.status,self.payment.issuer);
  console.log("---      fulfillments  ",  self.fulfillments.status);
  if(self.getTotalPrice){
    console.log("---      full price    ",  self.getTotalPrice())
  }
  if(self.cancel){
    console.log("---      cancel.status ",  self.cancel.reason);
    console.log("---      cancel.when   ",  self.cancel.when);
  }
  console.log("---      closed        ",  self.closed);
  console.log("---      created       ",  self.created);
  console.log("---      user          ",  self.email);
  console.log("---      rank          ",  self.rank);
  if(self.items){
    console.log("---      items           ",  self.items.map(function(i){ return i.sku}).join(','));
    console.log("---      + finaleprice   ",  self.items.map(function(i){ return i.finalprice}).join(','));
    console.log("---      + quantity      ",  self.items.map(function(i){ return i.quantity}).join(','));
    console.log("---      + status        ",  self.items.map(function(i){ return i.fulfillment.status}).join(','));
  }
  if(self.vendors){
    console.log("---      vendors       ",  self.vendors.map(function(v){ return v.slug}).join(','));
    console.log("---      collected     ",  self.vendors.map(function(v){ return v.collected}).join(','));
  }
}

exports.printInfo=function(){
  var now=new Date()
  console.log("-- now it's   ", now);
  console.log("-- available shipping days   ", config.shop.order.weekdays.join(','));
  console.log("-- order payment timelimite (s)   ", config.shop.order.timeoutAndNotPaid);
  console.log("-- order preparation timelimit (hours)   ", config.shop.order.timelimit);
  console.log("--    ");
  console.log("-- next shipping day for customers  ", this.findNextShippingDay());
  console.log("-- next shipping day for sellers  ", this.findCurrentShippingDay());
}

//
// prepare one product as order item
exports.prepare=function(product, quantity, note, shops){
  var copy={}, keys=['sku','title','categories','vendor'];
  function getPrice(p){
    if(p.attributes.discount && p.pricing.discount)
      return p.pricing.discount;
    return p.pricing.price;
  }

  assert(product)
  assert(product.vendor)

  keys.forEach(function(key){
    copy[key]=product[key];
  })

  if(shops){
    copy.vendor=_.find(shops,function(shop){return (shop._id+'')===copy.vendor}).urlpath
  }

  copy.quantity=quantity;
  copy.price=getPrice(product)
  copy.part=product.pricing.part;
  copy.note=note;
  copy.finalprice=getPrice(product)*quantity;
  copy.fulfillment={status:'partial'}
  return copy;
}

exports.getShippingPrice=function(factor){
  // check if value exist, (after creation) 
  if(this.payment.fees&&this.payment.fees.shipping){
    return this.payment.fees.shipping;
  }
  //
  // this should be always true, if fulfillment exist then shipping is stored
  assert(!this.fulfillment)

  // now compute shipping value to store in order. Several sources:
  // 1) coupon for freeshipping
  //   --> this.payment.coupons


  // 2) amount depend on price
  // 3) amount depend on grouped orders

  
  // implement 3) get free shipping!
  if (config.shop.shipping.free&&this.getSubTotal()>=config.shop.shipping.free){
    return 0;
  }

  // implement 3) get half shipping!
  else if (config.shop.shipping.half&&this.getSubTotal()>=config.shop.shipping.half){
    return config.shop.shipping.price/2;
  }


  return config.shop.shipping.price;
}

/**
 * total price
 *  - some of item finalprice ()
 *  - add payment gateway fees [visa,postfinance,mc,ae]
 *  - add shipping
 */
exports.getTotalPrice=function(factor){
  var total=0.0;
  this.items&&this.items.forEach(function(item){
    //
    // item should not be failure (fulfillment)
    if(item.fulfillment.status!=='failure'){
      total+=item.finalprice;
    }
  });

  // before the payment fees! 
  // add shipping fees (10CHF)
  total+=this.getShippingPrice();

  //
  // add gateway fees
  for (var gateway in config.shop.order.gateway){
    gateway=config.shop.order.gateway[gateway]
    if (gateway.label===this.payment.issuer){
      total+=total*gateway.fees;
      break;
    }
  }

  // add mul factor
  factor&&(total*=factor);


  return parseFloat((Math.round(total*20)/20).toFixed(2));
}

exports.getSubTotal=function(){
  var total=0.0;
  this.items&&this.items.forEach(function(item){
    //
    // item should not be failure (fulfillment)
    if(item.fulfillment.status!=='failure'){
      total+=item.finalprice;
    }
  });

  return parseFloat((Math.round(total*20)/20).toFixed(2));
}

//
// format date for this order
exports.getDateString=function(date){
  return db.model('Orders').formatDate(date||this.shipping.when,(date===undefined));
}


exports.formatDate=function(date, withTime){
  var format={
    months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
  }

  var when=new Date(date);
  var m=format.months[when.getMonth()];
  var d=format.weekdays[when.getDay()]
  var day=when.getDate()
  // set time
  var time='';if(withTime)time=" de "+config.shop.order.shippingtimes[when.getHours()];

  return d+" "+day+" "+m+" "+when.getFullYear()+time;
}



//
// filter order content by User//Shop 
exports.filterByShop=function(orders,shopname){
  assert(shopname)
  assert(orders)
  var i=0, toKeep=[];

  orders.forEach(function(order,j){
    //
    // remove exo shops
    i=order.vendors.length;while (i--){
      if(shopname.indexOf(order.vendors[i].slug)===-1){
          order.vendors.splice(i,1)
      }
    }
    if(order.vendors.length){
      toKeep.push(order)
    }
  })

  toKeep.forEach(function(order,j){
    //
    // remove exo items
    i=order.items.length;while (i--){
      if(shopname.indexOf(order.items[i].vendor+'')===-1){
          order.items.splice(i,1)
      }
    }


  })

  return toKeep
}

exports.getVendorsSlug=function  (orders) {
  if(!orders)return [];
  var slugs=orders.map(function (order) {    
      return order.vendors.map(function (vendor) {
        return vendor.slug;
      })
  })
  return _.uniq(_.flatten(slugs))
}

//
// group by shop
exports.groupByShop=function(orders){
  assert(orders)
  var shops={}
  function findOneVendor(order,slug){
    for (var i = order.vendors.length - 1; i >= 0; i--) {
      if(order.vendors[i].slug===slug)return order.vendors[i]
    };
  }
  orders.forEach(function(order){
    order.items.forEach(function(item){

      // init item for this shop
      if(!shops[item.vendor]){
        shops[item.vendor]={items:[],details:null}
      }
      // add item to this shop
      item.rank=order.rank
      item.oid=order.oid
      item.email=order.email
      item.customer=order.customer
      item.created=order.created
      item.shipping=order.shipping
      item.fulfillments=order.fulfillments
      shops[item.vendor].items.push(item);
      if(!shops[item.vendor].details){
        shops[item.vendor].details=findOneVendor(order,item.vendor)
      }
    })
  })
  return shops
}


/* jump the N day in week (0=sunday,1=monday, ...)
 * if next N day is before today then jump next week
 */
exports.jumpToNextWeekDay=function(date, jump) {
  // 86400000[ms] = 24 * 60² * 1000
  var nextday=((jump-date.getDay())%7)
  var week=(nextday>=0)?0:7*86400000;
  var nextweek=new Date(+date.getTime()+nextday*86400000+week)
  // next date always includes all shipping times: 12:00, 17:00, 19:00 ... <=23h00
  nextweek.setHours(23,0,0,0)
  return nextweek;

}

/* return array of one week of shipping days available for customers*/
exports.findOneWeekOfShippingDay=function(){
  var next=this.findNextShippingDay(), all=[], nextDate=next

  // get current day in the array
  var idxDay=config.shop.order.weekdays.indexOf(next.getDay());

  //
  // end of week
  for (var i = idxDay; i < config.shop.order.weekdays.length; i++) {
    nextDate=new Date((config.shop.order.weekdays[i]-nextDate.getDay())*86400000+nextDate.getTime());
    nextDate.setHours(next.getHours(),0,0,0)
    all.push(nextDate)
  };

  //
  // ellapsed time before the end of week
  nextDate=new Date((7-nextDate.getDay())*86400000+nextDate.getTime());

  //
  // next week
  for (var i = 0; i < idxDay; i++) {
    nextDate=new Date((config.shop.order.weekdays[i]-nextDate.getDay())*86400000+nextDate.getTime());
    nextDate.setHours(next.getHours(),0,0,0)
    all.push(nextDate)
  };



  // config.shop.order.weekdays.forEach(function(day){
  //   // next = 2
  //   // all=[1,2,4]
  //   // result =[2,4,1]
  //   console.log('day, next day--------',day, next.getDay())
  //   if(day<next.getDay()){
  //     // 7-5+1=3 => 5+3=(8%)
  //       nextDate=new Date((7-next.getDay()+day)*86400000+next.getTime());
  //       nextDate.setHours(next.getHours(),0,0,0)
  //       console.log('before-----------',nextDate.getDay())
  //       if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
  //         all.push(nextDate)
  //   }else if(day>=next.getDay()){
  //       nextDate=new Date((day-next.getDay())*86400000+next.getTime())
  //       nextDate.setHours(next.getHours(),0,0,0)
  //       if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
  //         all.push(nextDate)
  //   }
  // })

  return all.sort(function(a,b){
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    return a.getTime() - b.getTime();
  });
}

exports.findNextShippingDay=function(tl,th){
  var now=new Date(), 
      next, 
      timelimit=tl||config.shop.order.timelimit,
      timelimitH=th||config.shop.order.timelimitH;
      // 24h == 86400000

      // remove min/sec
      now.setHours(now.getHours(),0,0,0)

  // looking for end of the week 
  for (var i = 0; i < config.shop.order.weekdays.length; i++) {
    var day=config.shop.order.weekdays[i];
    if(day>=now.getDay()){
      // a valid day is at least>=timelimit 
      next=new Date(now.getTime()+86400000*(day-now.getDay()))      
      next.setHours(timelimitH,0,0,0)
      // console.log('----- this week -- delta 1',((next.getTime()-now.getTime())/3600000),timelimit,(day-now.getDay()))
      if(((next.getTime()-now.getTime())/3600000)>timelimit){
        //console.log('return this',next)
        return next;
      }
    }
  }

  // looking for begin of the week 
  for (var i = 0; i < config.shop.order.weekdays.length; i++) {
    var day=config.shop.order.weekdays[i];
    if(day<now.getDay()){
      next=new Date((7-now.getDay()+day)*86400000+now.getTime());
      next.setHours(timelimitH,0,0,0)
      // console.log('----- next week -- delta 2',((next.getTime()-now.getTime())/3600000),timelimit,((7-now.getDay()+day)))
      if(((next.getTime()-now.getTime())/3600000)>timelimit){
        //console.log('for next week',next)
        return next;
      }
    }

  }



}



/* return the current shipping day this is for sellers*/
exports.findCurrentShippingDay=function(){
  var timelimitH=Number(Object.keys(config.shop.order.shippingtimes).sort()[0])+8
  timelimitH=23;
  return this.findNextShippingDay(0.1,Number(timelimitH))
}
