

  
module.exports = function(app) {
  var path='../controllers/';
  var api 			= require(path+'api');
  var auth 			= require(path+'auth');
  var home 			= require(path+'home');
  var products 	= require(path+'products');
  var users 	  = require(path+'users');
  var shops 	  = require(path+'shops');
  var emails 	  = require(path+'emails');
  var categories= require(path+'categories');
  var _         = require('underscore');


	

	
	
  //
  // auth 
  app.get ('/logout', auth.logout);
 	app.get ('/login', auth.login);
  app.post('/login', auth.login_post);
  app.get ('/register', auth.register);
  app.post('/register', auth.register_post);
  
  //
  // user
  app.get('/v1/users/me', users.me);
  app.post('/v1/users/:id',users.ensureMe, users.update);
  app.post('/v1/users/:id/password',users.ensureMe, users.password);
  app.post('/v1/revover/:email/password', users.recover);
  
	//
	// home
  app.get ('/', home.index(app));
  app.get ('/v1', api.index(app));

  //
  //config
  app.get ('/v1/config', api.config);
  
  //
  // validation validation
  app.get ('/v1/validate',auth.ensureAuthenticated, emails.list);
  app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  app.get ('/v1/validate/:uid/:email', emails.validate);
  
  //
  // category
  app.get ('/v1/category', categories.list);
  app.get ('/v1/category/:category', categories.get);
  app.post('/v1/category', auth.ensureAdmin, categories.create);
  app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  app.delete('/v1/category/:category', auth.ensureAdmin, categories.remove);
  
  
  // global products 
  app.get('/v1/products/:sku',products.get);
  app.get('/v1/products',products.list);
  app.get('/v1/products/category/:category',products.list);
  app.get('/v1/products/location/:location',products.list);
  app.get('/v1/products/category/:category/details/:details',products.list);
  app.get('/v1/products/location/:location/category/:category',products.list);
  app.get('/v1/products/location/:location/category/:category/details/:details',products.list);

  // not needed for now
  //app.post('/v1/products', products.ensureShopOwnerOrAdmin, products.create);
  app.post('/v1/products/:sku', products.ensureOwnerOrAdmin, products.update);

  app.delete('/v1/products/:sku',products.ensureOwnerOrAdmin, products.remove);
  //app.delete('/v1/products',shops.ensureOwnerOrAdmin, products.massRemove);

  
  // shop 
  app.get('/v1/shops', shops.list);
  app.get('/v1/shops/category/:category', shops.list);
  app.get('/v1/shops/:shopname', shops.get);
  app.get('/v1/shops/:shopname/products', products.list);
  app.get('/v1/shops/:shopname/products/category/:category', products.list);
  app.get('/v1/shops/:shopname/products/category/:category/details/:details', products.list);

  app.post('/v1/shops', auth.ensureAuthenticated, shops.create);
  app.post('/v1/shops/:shopname', shops.ensureOwnerOrAdmin, shops.update);
    
  app.post('/v1/shops/:shopname/products', shops.ensureOwnerOrAdmin, products.create);

  app.delete('/v1/shops/:shopname',shops.ensureOwnerOrAdmin, shops.remove);

  
  
};
