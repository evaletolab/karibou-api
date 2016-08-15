var db = require('mongoose'),
    _=require('underscore');


//
// prepare Model for mail
// Model contains lists of orders grouped by shop
exports.prepareOrdersForMail=function (when,shops,closed, cb) {
  var Orders=this;

  var criteria={fulfillment:closed}

  //
  // restrict to a list of shopname
  // no shop 'undefined' means all shops available (admin only!)
  criteria.shop=shops.length?shops:undefined;

  // 
  // restrict for open order is the default

  //
  // select the shipping day
  if(!when){
    criteria.nextShippingDay=true;
  }else{
    criteria.when=new Date(when);
  }


  Orders.findByCriteria(criteria, function(err,orders){
    if(err){
      return cb(err);
    }

    if(!orders.length){
      // return an empty model
      return cb(0,{});
    }

    // orders.forEach(function (o) {
    //   console.log(Orders.print(o))
    // })

    //
    // find all vendors for a list of orders
    if(!shops||!shops.length){
      shops=Orders.collectVendorsSlug(orders);
    }


    //
    // filter content for each shop
    var contents={},formatWhen=Orders.formatDate(when), items=[], products={};
    shops.forEach(function (shop) {
      var content={products:[]};items=[];
      Orders.filterByShop(orders,shop).forEach(function(order){
          order.items.forEach(function(item, idx){
            if(idx===0)item.changeCustomer=true;        
            item.rank=order.rank;
            item.oid=order.oid;
            item.name=order.customer.name;
            item.email=order.customer.email.address;
            items.push(item);

            //
            // FT some vendors needs the list of all products (of all orders) to prepare 
            if(!products[item.sku]){
              products[item.sku]={quantity:0,total:0,title:item.title+'('+item.part+')',option:(item.variant&&item.variant.title)};
            }
            products[item.sku].quantity+=item.quantity;
            products[item.sku].total+=item.finalprice;  

          });
      });    

      // 
      // prepare the final model
      content.shop=Orders.findOneVendorFromSlug(orders,shop);
      content.shippingWhen=formatWhen;
      content.items=items;
      //
      // map product list
      Object.keys(products).sort(function(a,b){return products[b].quantity-products[a].quantity;}).forEach(function(sku){
        content.products.push({
          sku:sku,
          quantity:products[sku].quantity,
          title:products[sku].title,
          option:products[sku].option,
          total:products[sku].total
        })
      })


      contents[shop]=content;


    });


    return cb(0,contents);
  });
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
      monthorders=0,
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

  function itemGetTitle (item) {
    var title=item.title;
    if(item.variant)
      item.title=item.title+' ('+item.variant.title+')';
    return title;
  }
  monthorders=orders.length;

  //
  // group by shops
  oshops=Orders.groupByShop(orders);
  Object.keys(oshops).forEach(function(slug){
    total=amount=count=totalfees=0; monthorder=[];
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
          title:itemGetTitle(item),
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
        totalfees+=parseFloat((item.finalprice*item.fees).toFixed(2));
        amount+=parseFloat(item.price.toFixed(2));          
        if(!products[item.sku])products[item.sku]={count:0,amount:0,title:item.title+'('+item.part+')'}
        products[item.sku].count+=item.quantity  
        products[item.sku].amount+=item.finalprice  
      }
    }); // end of items

    shop=findShopBySlug(shops,slug)
    result.shops[slug].monthitems=count;
    result.shops[slug].monthamount=parseFloat((total).toFixed(2));
    result.shops[slug].monthorders=_.uniq(monthorder).length;
    result.shops[slug].details=oshops[slug].details;
    if(shop&&shop.address){  
      result.shops[slug].streetAdress=shop.address.streetAdress;
      result.shops[slug].region=shop.address.region;
      result.shops[slug].postalCode=shop.address.postalCode;
      result.shops[slug].geo=shop.address.geo;
    }
    
    result.shops[slug].monthfees=parseFloat((totalfees).toFixed(2));

    monthamount+=result.shops[slug].monthamount;
    monthitems+=result.shops[slug].monthitems;
    monthca+=result.shops[slug].monthfees;

    // access fees %
    // => result.shops[slug].details.fees

  })

  result.monthamount=parseFloat(monthamount.toFixed(2));
  result.monthca=parseFloat(monthca.toFixed(2));
  result.monthitems=monthitems;
  result.monthorders=monthorders;

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
