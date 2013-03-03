

  
module.exports = function(app) {
  var path='../controllers/';
  var api 			= require(path+'api');
  var auth 			= require(path+'auth');
  var home 			= require(path+'home');
  var products 	= require(path+'products');
  var users 	= require(path+'users');
  var shops 	= require(path+'shops');
  var emails 	= require(path+'emails');
  var _       = require('underscore');


	

	
	
  //
  // auth 
  app.get('/logout', auth.logout);
 	app.get('/login', auth.login);
  app.post('/login', auth.login_post);
  app.get('/register', auth.register);
  app.post('/register', auth.register_post);
  
  
	//
	// home
  app.get('/', home.index(app));
  app.get('/v1', api.index(app));
  
  //
  // email validation
  app.get ('/v1/validate',auth.ensureAuthenticated, emails.list);
  app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  app.post('/v1/validate/:uid', emails.validate);
  
  
  //
  // user
  app.get('/v1/users/me', users.me);
  app.post('/v1/users/:id', users.update);
  
  // global products 
  app.get('/v1/products/:sku',products.get);
  app.get('/v1/products',products.list);
  app.get('/v1/products/category/:category',products.list);
  app.get('/v1/products/location/:location',products.list);
  app.get('/v1/products/category/:category/detail/:detail',products.list);
  app.get('/v1/products/location/:location/category/:category',products.list);
  app.get('/v1/products/location/:location/category/:category/detail/:detail',products.list);
  
  // shop 
  app.get('/v1/shops', shops.list);
  app.get('/v1/shops/:shopname', shops.get);
  app.get('/v1/shops/:shopname/products', products.list);
  app.get('/v1/shops/:shopname/products/category/:category', products.list);
  app.get('/v1/shops/:shopname/products/category/:category/detail/:detail', products.list);

  app.post('/v1/shops', auth.ensureAuthenticated, shops.create);
  app.post('/v1/shops/:shopname', auth.ensureAuthenticated, shops.update);
    
  app.post('/v1/shops/:shopname/products', auth.ensureAuthenticated, products.create);

  app.post('/v1/shops/:shopname/delete',auth.ensureAuthenticated, shops.remove);

  
  app.delete('/v1/products',auth.ensureAuthenticated, products.massRemove);
  app.delete('/v1/products/:sku',auth.ensureAuthenticated, products.remove);
  app.put('/v1/products', auth.ensureAuthenticated, products.massUpdate);
  app.put('/v1/products/:sku', auth.ensureAuthenticated, products.update);
  
};
