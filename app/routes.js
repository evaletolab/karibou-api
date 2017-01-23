

  
module.exports = function(app, config, passport) {
  var path='../controllers/';

  var api       = require(path+'api');
  var wallets   = require(path+'wallets');
  var psp       = require(path+'psp');
  var stats     = require(path+'stats');
  var auth 			= require(path+'auth');
  var home 			= require(path+'home');
  var products 	= require(path+'products');
  var users 	  = require(path+'users');
  var shops     = require(path+'shops');
  var orders    = require(path+'orders');
  var emails    = require(path+'emails');
  var docs      = require(path+'documents');
  var categories= require(path+'categories');
  var _         = require('underscore');


  //
  // wrap a request to a simple queuing system. 
  // It's not efficient, but this should avoid race condition on product and orders
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
	
  function longcached(req, res, next) {
    res.setHeader('Cache-Control', 'public, max-age=120000');
    return next();
  }
  
	
  //
  // auth 
  app.get ('/logout', auth.logout);
 	app.get ('/login', auth.login);
  app.post('/login', queued(auth.login_post));
  app.get ('/register', auth.register);
  app.post('/register', queued(auth.register_post));

  //
  // sitemap & robots
  app.get ('/sitemap.xml', api.sitemap);
  app.get ('/seo/sitemap.xml', api.sitemap);
  app.get ('/robots.txt', api.robots);
  app.get ('/seo/robots.txt', api.robots);
  
  //
  // documents
  app.get ('/v1/documents', auth.ensureAuthenticated, docs.findByOwner);
  app.get ('/v1/documents/sku/:sku', docs.findBySkus);
  app.get ('/v1/documents/category/:category', docs.findByCategory);
  app.get ('/v1/documents/:slug', docs.get);
  // documents update/create
  app.post('/v1/documents/:slug', auth.ensureAuthenticated, docs.ensureOwnerOrAdmin,docs.update);
  app.post('/v1/documents', auth.ensureAuthenticated,docs.create);


  //
  // activities
  app.get('/v1/activities', auth.ensureAuthenticated,api.activities);

  //
  // wallet or giftcode
  app.get ('/v1/wallets', auth.ensureAdmin,wallets.listAllWallet);
  app.get ('/v1/wallets/giftcard', auth.ensureAuthenticated,wallets.listGiftWallet);
  app.get ('/v1/wallets/giftcard/count', wallets.countGiftcode);
  app.get ('/v1/wallets/giftcard/:card', auth.ensureAuthenticated,wallets.getGiftWallet);
  app.get ('/v1/wallets/:alias', wallets.ensureAdminOrOwner,wallets.getWallet);
  app.post('/v1/wallets', auth.ensureAuthenticated,wallets.createWallet);
  app.post('/v1/wallets/register/:alias', wallets.ensureAdminOrOwner,wallets.registerGiftcode);
  app.post('/v1/wallets/expiry/:wid', auth.ensureAdmin,auth.checkPassword,wallets.updateExpiry);
  app.post('/v1/wallets/credit/:wid', auth.ensureAdmin,auth.checkPassword,wallets.creditWallet);
  app.post('/v1/wallets/:wid', auth.ensureAdmin,auth.checkPassword,wallets.updateBANK);


  //
  // stats
  app.get('/v1/stats/orders/ca/shop/:shopname?', auth.ensureAdmin, stats.getCAByYearMonthAndVendor);
  app.get('/v1/stats/orders/sells', auth.ensureAdmin,  stats.getSellValueByYearAndWeek);
  app.get('/v1/stats/orders/by/postal', auth.ensureAdmin, stats.ordersByPostalVsUsersByPostal);
  app.get('/v1/stats/orders/by/users', auth.ensureAdmin, stats.ordersByUsers);
  app.get('/v1/stats/orders/by/users/and/products', auth.ensureAdmin, stats.favoriteProductsVsUsers);


  //
  // user
  app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  app.get('/v1/users', auth.ensureAdmin, users.list);
  app.get('/v1/users/sessions', auth.ensureAdmin,api.sessions);
  app.post('/v1/users/:id', users.ensureMeOrAdmin,users.update);
  app.post('/v1/users/:id/like/:sku', users.ensureMe,users.like);
  app.post('/v1/users/:id/unlike/:sku', users.ensureMe,users.unlike);
  app.post('/v1/users/:id/status', auth.ensureAdmin,users.status);
  app.post('/v1/users/:id/password',users.ensureMe, users.password);

  //
  // manage payment
  app.post('/v1/users/:id/payment', users.ensureMeOrAdmin,users.addPayment);
  app.post('/v1/users/:id/payment/:alias/check', users.ensureMeOrAdmin,users.checkPaymentMethod);
  app.post('/v1/users/:id/payment/:alias/delete', users.ensureMeOrAdmin,users.deletePayment);
  app.post('/v1/users/:id/payment/:alias/update', users.ensureMe,users.updatePayment);

  // recover email  
  app.post('/v1/recover/:token/:email/password', users.recover);
  
  //
  // delete
  app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);

	//
	// home
  app.get ('/', home.index(app));
  app.get ('/welcome', home.welcome);
  app.get ('/v1', api.index(app));

  //
  // SEO
  // app.get('/products/:sku',products.getSEO);
  app.get('/seo',home.SEO);
  app.get('/seo/shops',shops.allSEO);
  app.get('/seo/products',products.allSEO);
  app.get('/seo/products/category/:category',products.allSEO);
  app.get('/seo/products/:sku/:slug?',products.getSEO);

  // app.get('/shop/:shopname', shops.getSEO);
  app.get('/seo/shop/:shopname', shops.getSEO);
  app.get('/seo/shop/:shopname/products/:sku/:slug?', products.getSEO);
  app.get('/seo/content/:slug', docs.getSEO);


  //
  // system
  app.get ('/v1/config', api.config);
  app.post('/v1/config', auth.ensureAdmin, api.saveConfig);
  app.post('/v1/trace/:key', api.trace);
  app.post('/v1/comment', api.email);
  // temporary path for subscription
  app.post('/v1/message/:key/:subject?', api.message);
  app.post('/v1/github/webhook',api.github)


  // PSP gateway
  app.get ('/v1/psp/std',psp.pspStd)
  app.post('/v1/psp/:token/webhook',psp.webhook)
  app.get('/v1/users/:id/psp', users.ensureMe, psp.pspCharge);
  
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
  app.get('/v1/products/shops',shops.ensureOwnerOrAdmin,products.findByOwner);
  app.get('/v1/products/love',auth.ensureAuthenticated,products.love);
  app.get('/v1/products/search', products.search);
  app.get('/v1/products/:sku',products.get);
  app.get('/v1/products',cached,products.list);
  app.get('/v1/products/category/:category',cached,products.list);
  app.get('/v1/products/location/:location',products.list);
  app.get('/v1/products/category/:category/details/:details',products.list);
  app.get('/v1/products/location/:location/category/:category',products.list);
  app.get('/v1/products/location/:location/category/:category/details/:details',products.list);
  app.get('/v1/products/:sku/:title',products.get);
  
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
  // app.post('/v1/shops/:shopname/ask', auth.ensureUserValid, shops.email);
  app.post('/v1/shops/:shopname/status', shops.ensureOwnerOrAdmin, auth.ensureUserValid, shops.status);
    
  app.post('/v1/shops/:shopname/products', shops.ensureOwnerOrAdmin, auth.ensureUserValid, queued(products.create));

  app.put('/v1/shops/:shopname',shops.ensureOwnerOrAdmin, auth.ensureUserValid, auth.checkPassword, shops.remove);


  //
  // orders
  app.get('/v1/orders', auth.ensureLogisticOrAdmin, orders.list);
  app.get('/v1/orders/shops', auth.ensureUserValid, orders.listByShopOwner);
  app.get('/v1/orders/shops/:shopname', shops.ensureOwnerOrAdmin, orders.listByShop);
  app.get('/v1/orders/users/:id', users.ensureMeOrAdmin, orders.list);
  app.get('/v1/orders/:oid', orders.ensureOwnerOrAdmin, orders.get);


  app.post('/v1/orders/items/verify',orders.verifyItems)
  
  // only valid user with valid alias can create new order
  app.post('/v1/orders', auth.ensureUserValid, orders.ensureValidAlias, queued(orders.create));

  // only valid shop that bellongs to the order can update the order
  app.post('/v1/orders/:oid/items', orders.ensureShopOwnerOrAdmin, queued(orders.updateItem));
  app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);

  // only owner to the order can cancel order
  // shop can only cancel their items
  app.post('/v1/orders/:oid/cancel', orders.ensureOwnerOrAdmin, queued(orders.cancel));

  // capture payment 
  app.post('/v1/orders/:oid/capture', auth.ensureAdmin, queued(orders.capture));
  app.post('/v1/orders/:oid/refund', auth.ensureAdmin, queued(orders.refund));

  // for admin only
  app.post('/v1/orders/:oid/remove', auth.ensureAdmin, orders.remove);

  // post order items to shopname
  app.post('/v1/orders/shops/email',auth.ensureAuthenticated,orders.informShopToOrders);
  app.post('/v1/orders/:shopname/email',shops.ensureOwnerOrAdmin,orders.informShopToOrders);

  // shopper update logistic
  app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  app.post('/v1/orders/:shopname/collect', auth.ensureLogisticOrAdmin, orders.updateCollect);


  //
  // invoices
  app.get('/v1/orders/invoices/users/:month/:year?', auth.ensureAdmin, orders.invoicesByUsers);
  app.get('/v1/orders/invoices/shops/:month/:year?', orders.ensureHasShopOrAdmin, orders.invoicesByShops);


};
