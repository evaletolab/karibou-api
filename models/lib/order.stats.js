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
// matrix of users and ordered product
exports.favoriteProductsVsUsers=function(cb){
  var Orders=this;

  Orders.aggregate([
       {$match: { 'payment.status': 'paid' }},
       {$project:{week: { $week: "$shipping.when"}, year: { $year: "$shipping.when" },
                 oid:1,
                 items:1,
                 email:1,
                 shipping:1
       }},
       {$group:
           {
             _id:"$email",
             items:{$addToSet:"$items.sku"},
           }
       },
       {$sort:{_id:1}}
  ],cb);

};

//
// compute Sell value (not CA) by week and by year
exports.getSellValueByYearAndWeek=function(query,cb){
  query=query||{ closed: { '$exists': false } };

  return db.model('Orders').aggregate(
    [
       { $match: { 'payment.status': 'paid' }},
       {$project:{
          week: { $week: "$shipping.when"}, 
          year: { $year: "$shipping.when"},
          oid:1,
          items:1,
          email:1,
          shipping:1
       }},
       {$group:
           {
             _id:{week:"$week",year:"$year"},
             items:{$push:{sku:"$items.sku",finalprice:"$items.finalprice"}},
             emails:{$push:"$email"},
             orders: { $sum: 1 }
           }
       },
       {$sort:{year:-1,_id:-1}}     
    ],function (err,results) {
      if(err){
        return cb(err);
      }

      if(!results||!results.length){
        return cb(null,{});
      }

      var stats={}, axisX_date={};
      results.forEach(function(result){
        var sum=0,total=0,avg=0,div=1;
        //
        // items for one order
        result.items.forEach(function(item,i){
          total=item.finalprice.reduce(function(pv, cv) { return pv + cv; }, 0);
          sum+=total;
          avg=(avg+total)/div;div=2;
        });


        //
        // build set of axisY
        axisX_date[result._id.year+'.'+result._id.week]=Object.keys(axisX_date).length;

        //
        // grouping by year
        if(stats[result._id.year]===undefined){
          stats[result._id.year]={total:0,orders:0};
        }
        stats[result._id.year].total+=sum;
        stats[result._id.year].orders+=result.orders;
        stats[result._id.year][result._id.week]={
          total:parseFloat(sum.toFixed(2)),
          avg:parseFloat(avg.toFixed(2)),
          orders:result.orders
        }
      });      


      // prepare axis
      Object.keys(axisX_date).sortSeparatedAlphaNum().forEach(function (date,i) {
        axisX_date[date]=i;
      });

      stats.axis={
        x:axisX_date
      }
      //
      //
      return cb(null,stats)
    });
};

//
// follow CA for shops
exports.getCAByYearMonthAndVendor=function (filter,cb) {
  filter=filter||{};
  filter=_.extend(filter,{'items.fulfillment.status':'fulfilled'})
  db.model('Orders').aggregate([
       { $match: { 'payment.status': 'paid' } },
       {$project:{
             month:{ $month:"$shipping.when"}, 
             week: { $week: "$shipping.when"}, 
             year: { $year: "$shipping.when" },
             oid:1,
             items:1,
             email:1,
             vendors:1
       }},
       { $unwind: '$vendors'}, 
       { $unwind: '$items'}, 
       { $match: filter  },
       {$group:
           {
             _id:{ month:"$month", year:"$year", vendor:"$vendors.slug"},
             items:{$addToSet:{
                oid:"$oid",
                sku:"$items.sku",
                finalprice:"$items.finalprice",
                quantity:"$items.quantity",
                vendor:"$items.vendor",
                fees:"$vendors.fees"
             }},
             vendor:{$first:"$vendors"},
             details:{$push:{email:"$email",oid:"$oid"}},
             orders: { $sum: 1 }
           }
       },
       {$sort:{'_id.year':-1,'_id.month':-1}}
  ],function(err,results){
      if(err){
        return cb(err);
      }

      if(!results||!results.length){
        return cb(null,{});
      }

      var group={}, series_shops={}, axisX_date={};

      //
      // group amount CA by vendor
      results.forEach(function(result){
        var stats={};
        result.items.forEach(function(item){

          //
          // grouped by vendor (restor the unwind on vendors )
          if(item.vendor!==result._id.vendor){
            return true;
          }
          //
          // set for axisY
          series_shops[item.vendor]=Object.keys(series_shops).length;

          if(!stats[item.vendor]){
            stats[item.vendor]={amount:0,orders:0,fees:0,items:0,oid:{}};
            stats[item.vendor].details=result.vendor;
          }
          stats[item.vendor].amount+=item.finalprice;
          stats[item.vendor].fees = parseFloat((stats[item.vendor].fees+item.finalprice*item.fees).toFixed(2));
          stats[item.vendor].items+=item.quantity;
          stats[item.vendor].amount=parseFloat(stats[item.vendor].amount.toFixed(2));

          //
          // count orders grouped by vendor
          if(!stats[item.vendor].oid[item.oid]){
            stats[item.vendor].orders++;
            stats[item.vendor].oid[item.oid]=1;
          }
          // console.log('---------------',result._id,Object.keys(group[result._id.year][result._id.month]))
        });

        //
        // build set of axisY
        axisX_date[result._id.year+'.'+result._id.month]=Object.keys(axisX_date).length;

        //
        // group vendor by year and month
        if(!group[result._id.year]){
          group[result._id.year]={};
        }
        if(!group[result._id.year][result._id.month]){
          group[result._id.year][result._id.month]={};          
        }
        group[result._id.year][result._id.month]=_.extend({},group[result._id.year][result._id.month],stats);

      });


      //
      // compute CA for month
      Object.keys(group).forEach(function (year) {
        var amount=0,fees=0,orders=0,items=0;
        // for each year
        Object.keys(group[year]).forEach(function (month) {
          // for each month
          amount=0,fees=0,orders=[],items=0;
          Object.keys(group[year][month]).forEach(function (slug) {
            // for each slug
            amount=parseFloat((amount+group[year][month][slug].amount).toFixed(2));
            fees=parseFloat((fees+group[year][month][slug].fees).toFixed(2));
            items+=group[year][month][slug].items;
            //
            // order is special because the same oid can be shared between vendors
            if(group[year][month][slug].oid){
              orders=_.union(Object.keys(group[year][month][slug].oid),orders);
              delete group[year][month][slug].oid;
            }
          });
          group[year][month].amount=amount;
          group[year][month].fees=fees;
          group[year][month].orders=_.uniq(orders).length;
          group[year][month].items=items;

        });
      })

      // prepare axis
      Object.keys(series_shops).forEach(function (shop,i) {
        series_shops[shop]=i;
      });

      Object.keys(axisX_date).sortSeparatedAlphaNum().forEach(function (date,i) {
        axisX_date[date]=i;
      });

      group.axis={
        x:axisX_date,
        series:series_shops
      }
      return cb(null,group);
  });  
}


exports.getStatsByOrder=function(query){
  query=query||{ closed: { '$exists': false } };

  return db.model('Orders').aggregate(
     [
       { $match: query },
       {$project:{week: { $week: "$shipping.when"}, year: { $year: "$shipping.when" },
                 items:1,
                 shipping:1,
                 oid:1
       }},
       {$unwind: '$items'}, 
       {$group:
           {
             _id:"$oid",
             week:{$first:"$week"},
             totalAmount: { $sum: "$items.finalprice" },
             count: { $sum: "$items.quantity" }
           }
       },
       {$sort:{week:-1}}
     ]
  )
};

