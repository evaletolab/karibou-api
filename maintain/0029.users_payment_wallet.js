/**
 * Maintain mongo database
 * http://docs.mongodb.org/manual/reference/operator/#AdvancedQueries-%24type
 * 
 * 
 *  find all product where photo is a string
 *   - convert the field photo:string => photo:{url:string}
 *
 * Use case
 * 1) How to change the type of a field?
 *    see type here http://docs.mongodb.org/manual/reference/operator/type/#op._S_type
 *  db.foo.find( { 'bad' : { $type : 1 } } ).forEach( function (x) {   
 *   x.bad = new String(x.bad); // convert field to string
 *   db.foo.save(x);
 *  });
 *
 * 2) How to rename a field
 *    db.students.update( { _id: 1 }, { $rename: { "name.first": "name.fname" } } )
 *    db.students.update( { _id: 1 }, { $rename: { "name.last": "contact.lname" } } )
 *
 * $type:
 *    Double	1, String	2, Object	3, Array	4, Binary data	5, 
 *    Undefined (deprecated)	6, Object id	7, Boolean	8, Date	9, 
 *    Null	10, Regular Expression	11, JavaScript	13, 
 *    Symbol	14, JavaScript (with scope)	15, 
 *    32-bit integer	16, Timestamp	17, 64-bit integer	18, Min key	255, Max key	127
 *    
 */


// 
// {
//     "alias" : "8ff17caf9b429fa74d6f93a361fa2f8f44891e3ea22b41257857fdcf6be56caa0e0e0e0e",
//     "type" : "visa",
//     "name" : "oli evalet",
//     "number" : "40xxxxxxxxxx1881",
//     "csc" : "321",
//     "expiry" : "12/2015",
//     "updated" : 1413375339775
// }


exports.execute = function(db, script, callback){
	console.log(script,"Add wallet to all user.payments");
  var logs="", count=0;
  var Users=db.collection('users'),countUp=0;
  var tosave=false, errs=[],logs=[];
  var _=require('underscore');
  var karibou = require("karibou-wallet");

  //
  //
  karibou.configure({
    allowMultipleSetOption:true,
    apikey:config.payment.karibou.apikey,
    allowMaxAmount:config.payment.allowMaxAmount,
    debug:config.mail.develMode
  });

  var alias=function(user_id,last4,wallet_id){
  return (user_id+':'+last4+':'+wallet_id).crypt()  
}

	
  //'payments.issuer':{$ne:'wallet'}
  Users.find({}).toArray(function (err,users) {
    if (!users.length){
      return callback(null, "0 users have been updated")
    }
    console.log(script,"updating payment wallet: "+users.length );


    require('async').each(users, function(user, eachcb){

      var displayName=user.displayName||(user.name.givenName+' '+user.name.familyName);

      user.payments=_.reject(user.payments,function (payment) {
        return payment.issuer==='wallet';
      });

      //
      // add private account
      karibou.wallet.create({
        id:user.id,
        email:user.email.address,
        card:{name:displayName},
        description:'Votre compte privé'      
      }).then(function (wallet) {

        result={
          alias:alias(user.id,wallet.card.last4,wallet.wid),
          number:'xxxx-xxxx-xxxx-'+wallet.card.last4,
          issuer:'wallet',
          name:displayName,
          expiry:wallet.card.expiry,
          updated:Date.now(),
          provider:'wallet'
        };
        if(!user.payments){
          user.payments=[];
        }
        user.payments.push(result);
        Users.update({id:user.id},user,function (err) {
          if(err)errs.push(err);
          countUp++;
          console.log('wallet',user.email.address,wallet.card.last4,wallet.wid)
          eachcb(err);
        })


      }).then(undefined,function (error) {
          eachcb(error);
      });

    },function (err) {
      callback(err, countUp+"/"+users.length+" users have been updated");
    });

  }); 

}
