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
exports.favoriteProducts=function(cb){
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
}
