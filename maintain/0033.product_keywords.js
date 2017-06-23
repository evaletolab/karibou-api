

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
        });

        //
        // run update here
        require('async').each(p, function(product, eachcb){
            //      
            product.details.keywords=_cat[product.categories].name;
            
            //
            //FIXME hardcoded
            var isBio=(product.details.keywords==="Fruits & légumes")&&product.details.natural;
            product.details.internal="";
            if(product.details.biodynamics||product.details.bio||product.details.bioconvertion||isBio){    
                product.details.internal=" bio organique organic biodinamie naturel biodynamics";
            }
            if(product.details.vegetarian){    
                product.details.internal+=" végétarien vegetarian";
            }

            if(product.details.gluten){    
                product.details.internal+=" gluten glutenfree sans-gluten";
            }

            if(product.details.lactose){    
                product.details.internal+=" lactose sans-lactose";
            }

            if(product.details.grta){
                product.details.internal+=" grta";
            }

            product.details.keywords=product.details.keywords+' '+product.details.internal;
            

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
