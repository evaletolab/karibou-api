/**
 * Maintain mongo database
 * http://docs.mongodb.org/manual/reference/operator/#AdvancedQueries-%24type
 * 
 *    
 */


exports.execute = function(db, script, callback){
  console.log(script,"Add order.payment.fees.charge default value of 2.9%");
  var logs="", count=0;
  var orders=db.collection('orders');

  orders.update({'payment.fees.charge':{$exists:false}}, {$set: {'payment.fees.charge': 0.029}}, { multi: true });

  return callback(0,"orders have been updated");	
}
