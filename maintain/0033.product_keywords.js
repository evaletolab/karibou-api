

exports.execute = function(db, script, callback){
  console.log(script,"Update product.details.keyword  ");
  var logs="", count=0;
  var products=db.collection('products');
  var categories=db.collection('categories');

  //
  // cache all categories
  var _cat={};

  products.find( {'details.keywords':{$exists:false}}).toArray(function (err,p) {
	  if (!p.length){
	    return callback(null, "0 product have been updated")
	  }
    console.log(script,"migrating "+p.length +" products");
    // get all categories
    categories.find({}).toArray(function(err,cats){
        cats.forEach(function(cat){
          _cat[cat._id]=cat;
          console.log('--------------- 0',cat._id)
        });

        //
        // run update here
        require('async').each(p, function(product, eachcb){
            //      
          console.log('--------------- 1',product.categories)
            product.details.keywords=_cat[product.categories].name;
            if(product.details.biodynamics||product.details.bio||product.details.bioconvertion){    
                product.details.keywords+=" bio organic organique biodinamie naturel biodynamics";
            }
            
            console.log(product.sku,'keywords:',product.details.keywords )
            products.save(product,function(err){
                eachcb(err);        
            });
        },
        function(err){
            return callback(err, p.length+" keywords on products have been updated");
        });
    });
  });	
	
}
