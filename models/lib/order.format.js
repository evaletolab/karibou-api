var db = require('mongoose'),
    _=require('underscore');


// sort by date and customer
exports.sortByDateAndUser=function(o1,o2){
  // asc date
  if(o1.shipping.when!==o2.shipping.when){
    if (o1.shipping.when > o2.shipping.when) return 1;
    if (o1.shipping.when < o2.shipping.when) return -1;
    return 0;
  }
  // asc email
  return o1.customer.displayName.localeCompare(o2.customer.displayName)
}

//
// structure data for JSON output
exports.convertOrdersToRepportForShop=function(from,to,orders, shops, showAll){
  var Orders=this;
  var result={from:from,to:to,products:[],shops:{},users:{}}
  var amount=0,
      total=0,
      count=0,
      shipping=0, 
      monthamount=0,
      monthitems=0, 
      monthorder=[],
      monthca=0,
      products={}, 
      oshops={}, 
      shop;

  //
  // fast mapping slug to shop 
  function findShopBySlug (shops,slug) {
    return _.find(shops,function(s) {
      return s.urlpath===slug
    })
  }

  //
  // group by shops
  oshops=Orders.groupByShop(orders);
  Object.keys(oshops).forEach(function(slug){
    total=amount=count=ocount=0; monthorder=[];
    result.shops[slug]={items:[]};
    //
    // repport by shop
    oshops[slug].items.sort(Orders.sortByDateAndUser).forEach(function(item){

      //
      // map user items
      if(!result.users[item.customer.displayName]){
        result.users[item.customer.displayName]={}
      }
      //
      // map shops items
      // why the showAll???
      if(item.fulfillment.status==='fulfilled'){
        // compute order/mont for this shop
        monthorder.push(item.oid);

        // customer item
        if(!result.users[item.customer.displayName][item.sku]){
          result.users[item.customer.displayName][item.sku]={count:0,amount:0,title:item.title}
        }
        result.users[item.customer.displayName][item.sku].count+=item.quantity;
        result.users[item.customer.displayName][item.sku].amount+=item.finalprice;

        // shop item
        result.shops[slug].items.push({
          oid:item.oid,
          rank:item.rank,
          shipping:Orders.formatDate(item.shipping.when),
          customer:item.customer.displayName,
          quantity:item.quantity,
          title:item.title,
          part:item.part,
          price:item.price.toFixed(2),
          finalprice:item.finalprice.toFixed(2),
          fulfillment:item.fulfillment.status,
          note:item.note
        })
      }
      //
      // only fulfilled are computed
      if(item.fulfillment.status==='fulfilled'){
        count+=parseFloat(item.quantity);
        total+=parseFloat(item.finalprice.toFixed(2));
        amount+=parseFloat(item.price.toFixed(2));          
        if(!products[item.sku])products[item.sku]={count:0,amount:0,title:item.title+'('+item.part+')'}
        products[item.sku].count+=item.quantity  
        products[item.sku].amount+=item.finalprice  
      }
    }); // end of items

    shop=findShopBySlug(shops,slug)
    result.shops[slug].monthitems=count;
    result.shops[slug].monthamount=parseFloat((total).toFixed(2));
    result.shops[slug].monthorder=_.uniq(monthorder).length;
    result.shops[slug].details=oshops[slug].details;
    result.shops[slug].streetAdress=shop.address.streetAdress;
    result.shops[slug].region=shop.address.region;
    result.shops[slug].postalCode=shop.address.postalCode;
    result.shops[slug].geo=shop.address.geo;
    
    result.shops[slug].monthfees=parseFloat((total*oshops[slug].details.fees).toFixed(2));

    monthamount+=result.shops[slug].monthamount;
    monthitems+=result.shops[slug].monthitems;
    monthca+=result.shops[slug].monthfees;

    // access fees %
    // => result.shops[slug].details.fees

  })

  //FIXME fees should not be hardcoded ;( 
  result.monthamount=monthamount;
  result.monthca=monthca;
  result.monthitems=monthitems;

  //
  // pivot on user
  // Object.keys(result.users).forEach(function(user){
  //   var items=[]
  //   Object.keys(result.users[user]).forEach(function (sku) {
  //     items.push(result.users[user][sku])
  //   })
  //   result.users[user]=items
  // });


  //
  // pivot on product
  Object.keys(products).sort(function(a,b){return products[b].count-products[a].count;}).forEach(function(sku){
    result.products.push({
      sku:sku,
      count:products[sku].count,
      title:products[sku].title,
      amount:products[sku].amount
    })
  })
  return result;
}
