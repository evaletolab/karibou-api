

  
module.exports = function(app, config, passport) {
  var path='../controllers/';

  var api 			= require(path+'api');
  var auth 			= require(path+'auth');
  var home 			= require(path+'home');
  var products 	= require(path+'products');
  var users 	  = require(path+'users');
  var shops     = require(path+'shops');
  var orders    = require(path+'orders');
  var emails 	  = require(path+'emails');
  var categories= require(path+'categories');
  var _         = require('underscore');


  //
  // wrap a request to a simple queuing system. 
  // This should help to avoid race condition on product 
  var queue=require('../app/queue')(1,true);
  var queued=function(f){
    return function(req,res){
      queue.defer(f,req,res)
    }
  }


  function cached(req, res, next) {
    res.setHeader('Cache-Control', 'public, max-age=120');
    return next();
  }
	
	
  //
  // auth 
  app.get ('/logout', auth.logout);
 	app.get ('/login', auth.login);
  app.post('/login', auth.login_post);
  app.get ('/register', auth.register);
  app.post('/register', auth.register_post);
  
  //
  // user
  app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  app.get('/v1/users', auth.ensureAdmin, users.list);
  app.post('/v1/users/:id', users.ensureMe,users.update);
  app.post('/v1/users/:id/like/:sku', users.ensureMe,users.like);
  app.post('/v1/users/:id/unlike/:sku', users.ensureMe,users.unlike);
  app.post('/v1/users/:id/status', auth.ensureAdmin,users.status);
  app.post('/v1/users/:id/password',users.ensureMe, users.password);
  app.post('/v1/recover/:token/:email/password', users.recover);
  
	//
	// home
  app.get ('/', home.index(app));
  app.get ('/acceptcookie', home.acceptcookie);
  app.get ('/welcome', home.welcome);
  app.get ('/v1', api.index(app));

  //
  //config
  app.get ('/v1/config', cached, api.config);
  
  //
  // email validation
  app.get ('/v1/validate',auth.ensureAuthenticated, emails.list);
  app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  app.get ('/v1/validate/:uid/:email', emails.validate);
  
  //
  // category
  app.get ('/v1/category', cached, categories.list);
  app.get ('/v1/category/:category', categories.get);
  app.post('/v1/category', auth.ensureAdmin, categories.create);
  app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  
  
  // global products 
  app.get('/v1/products/love',auth.ensureAuthenticated,products.love);
  app.get('/v1/products/:sku',products.get);
  app.get('/v1/products',products.list);
  app.get('/v1/products/category/:category',products.list);
  app.get('/v1/products/location/:location',products.list);
  app.get('/v1/products/category/:category/details/:details',products.list);
  app.get('/v1/products/location/:location/category/:category',products.list);
  app.get('/v1/products/location/:location/category/:category/details/:details',products.list);

  // not needed for now
  //app.post('/v1/products', products.ensureShopOwnerOrAdmin, products.create);
  app.post('/v1/products/:sku', products.ensureOwnerOrAdmin, auth.ensureUserValid, queued(products.update));

  app.put('/v1/products/:sku',products.ensureOwnerOrAdmin, auth.ensureUserValid, auth.checkPassword,  queued(products.remove));
  //app.delete('/v1/products',shops.ensureOwnerOrAdmin, products.massRemove);


  //  
  // shop 
  app.get('/v1/shops', shops.list);
  app.get('/v1/shops/category/:category', shops.list);
  app.get('/v1/shops/:shopname', shops.get);
  app.get('/v1/shops/:shopname/status', shops.ensureOwnerOrAdmin, auth.ensureUserValid, shops.askStatus);
  app.get('/v1/shops/:shopname/products', products.list);
  app.get('/v1/shops/:shopname/products/category/:category', products.list);
  app.get('/v1/shops/:shopname/products/category/:category/details/:details', products.list);

  app.post('/v1/shops', auth.ensureUserValid, shops.ensureShopLimit, shops.create);
  app.post('/v1/shops/:shopname', shops.ensureOwnerOrAdmin, auth.ensureUserValid, queued(shops.update));
  app.post('/v1/shops/:shopname/ask', auth.ensureUserValid, shops.email);
  app.post('/v1/shops/:shopname/status', shops.ensureOwnerOrAdmin, auth.ensureUserValid, shops.status);
    
  app.post('/v1/shops/:shopname/products', shops.ensureOwnerOrAdmin, auth.ensureUserValid, queued(products.create));

  app.put('/v1/shops/:shopname',shops.ensureOwnerOrAdmin, auth.ensureUserValid, auth.checkPassword, shops.remove);


  //
  // orders
  app.get('/v1/orders', auth.ensureAdmin, orders.list);
  app.get('/v1/shops/:shopname/orders', shops.ensureOwnerOrAdmin, orders.list);
  app.get('/v1/users/:id/orders', users.ensureMeOrAdmin, orders.list);
  app.get('/v1/orders/:oid', orders.ensureOwnerOrAdmin, orders.get);

  app.post('/v1/orders/items/verify',orders.verifyItems)
  app.post('/v1/orders', auth.ensureUserValid, queued(orders.create));
  app.post('/v1/orders/:oid', orders.ensureOwnerOrAdmin, queued(orders.update));



  
  
};
