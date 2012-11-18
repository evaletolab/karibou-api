

  
module.exports = function(app) {
  var path='../controllers/';
  var api 			= require(path+'api');
  var auth 			= require(path+'auth');
  var home 			= require(path+'home');
  var products 	= require(path+'products');


	
	
  //
  // auth 
  app.get('/logout', auth.logout);
 	app.get('/login', auth.login);
  app.post('/login', auth.login_post);
  app.get('/register', auth.register);
  app.post('/register', auth.register_post);
  
	//
	// home
  app.get('/', home.index);
  
  //
  // api
  app.get('/v1', api.index);
  app.get('/v1/products',products.list);
  app.get('/v1/products/:id',products.get);
  app.delete('/v1/products',auth.ensureAuthenticated, products.mass_remove);
  app.delete('/v1/products/:id',auth.ensureAuthenticated, products.remove);
  app.post('/v1/products', auth.ensureAuthenticated, products.create);
  app.put('/v1/products', auth.ensureAuthenticated, products.mass_update);
  app.put('/v1/products/:id', auth.ensureAuthenticated, products.update);
  
};
