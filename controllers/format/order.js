var db = require('mongoose'),
    _=require('underscore'),
    Orders = db.model('Orders'),
    bus=require('../../app/bus');



//
// structure data for JSON output
exports.invoicesByShopsJSON=function(req,criteria,orders){
  var result={from:criteria.from,to:criteria.to,products:[],shops:{}}
  var amount=0,total=0,shipping=0, monthtotal=0;monthtotal, products={}, shops={}, showAll=req.query.all||false;


  //
  // group by shops
  shops=Orders.groupByShop(orders);
  Object.keys(shops).forEach(function(slug){
    total=amount=0;
    result.shops[slug]={items:[]};
    shops[slug].items.sort(criteria.byDateAndUser).forEach(function(item){
      if(item.fulfillment.status==='fulfilled' || showAll){
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
      //
      if(item.fulfillment.status==='fulfilled'){
        total+=parseFloat(item.finalprice.toFixed(2));
        amount+=parseFloat(item.price.toFixed(2));          
        if(!products[item.sku])products[item.sku]={count:0,amount:0,title:item.title+'('+item.part+')'}
        products[item.sku].count+=item.quantity  
        products[item.sku].amount+=item.finalprice  
      }
    })
    monthtotal+=total;
    result.shops[slug].details=shops[slug].details
    result.shops[slug].total=(total).toFixed(2)
    result.shops[slug].fees=(total*.15).toFixed(2)

  })

  result.monthtotal=monthtotal;
  result.monthca=(monthtotal*0.15)

  Object.keys(products).sort(function(a,b){return products[b].count-products[a].count;}).forEach(function(sku){
    result.products.push({
      count:products[sku].count,
      title:products[sku].title,
      amount:products[sku].amount
    })
  })

  return result;
}

//
// structure data for CSV
exports.invoicesByShopsCSV=function(req,criteria,orders){
  var result=[]
  var amount=0,total=0,shipping=0, monthtotal=0; products={}, shops={}, showAll=req.query.all||false;
  result.push(['du',criteria.from])
  result.push(['au',criteria.to])
  result.push(['shop/oid','shipping','customer','qty','title','part','amount','total']);


  //
  // group by shops
  shops=Orders.groupByShop(orders);
  Object.keys(shops).forEach(function(slug){
    result.push({slug:slug});
    total=amount=0;
    shops[slug].items.sort(criteria.byDateAndUser).forEach(function(item){
      if(item.fulfillment.status==='fulfilled' || showAll){
        result.push({
          oid:item.oid,
          rank:item.rank,
          shipping:Orders.formatDate(item.shipping.when),
          customer:item.customer.displayName,
          quantity:item.quantity,
          title:item.title,
          part:item.part,
          price:item.price,
          finalprice:item.finalprice,
          fulfillment:item.fulfillment.status,
          note:item.note
        })
      }
      //
      //
      if(item.fulfillment.status==='fulfilled'){
        total+=parseFloat(item.finalprice.toFixed(2));
        amount+=parseFloat(item.price.toFixed(2));          
        if(!products[item.sku])products[item.sku]={count:0,amount:0,title:item.title+'('+item.part+')'}
        products[item.sku].count+=item.quantity  
        products[item.sku].amount+=item.finalprice  
      }
    })
    monthtotal+=total;
    result.push(['commission',(total*.15),'','','','total',amount,total]);

  })

  result.push(['total ventes',monthtotal])
  result.push(['total commission',(monthtotal*0.15)])

  result.push(['distribution','produits du mois','CHF cumulé'])
  Object.keys(products).sort(function(a,b){return products[b].count-products[a].count;}).forEach(function(sku){
    result.push({
      count:products[sku].count,
      title:products[sku].title,
      amount:products[sku].amount
    })
  })

  return result;
}
