# Karibou-api
Karibou is an open-source project aim to help the creation of an 
online community marketplace. Our goal is to allow local food producers, artisans and artists 
to sell their products locally. There is alpha frontend available here http://karibou.evaletolab.ch/

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/evaletolab/karibou-api/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
[![Build Status](https://travis-ci.org/evaletolab/karibou-api.svg?branch=master)](https://travis-ci.org/evaletolab/karibou-api)

## Getting started
This is a backend part of the futur [karibou.*] application.

    $ git clone https://github.com/evaletolab/karibou-api.git
    $ cd karibou-api
    $ npm install
    $ optional edit config-devel|test.js
    $ mongod
    
Testing

    $ sudo npm -g install mocha
    $ NODE_ENV=test ./node_modules/.bin/mocha
    $ (or) make test

Running    

    $ node app


## API
Current API version is v1. You need to prepend `v1/` to app requests except auth.

* backend, http://api.karibou.evaletolab.ch/v1 
* from appfog, http://http://karibou-api.eu01.aws.af.cm/v1

### Auth
All requests that change state (`POST`, `PUT`, `DELETE`) require authentication.

#### Get user data
```
  #STATE  #ROUTE                                 #SECURITY                 #API
  app.get('/v1/users/me'                        , auth.ensureAuthenticated, users.me);
  app.get('/v1/users'                           , auth.ensureAdmin        , users.list);
  app.post('/v1/users/:id'                      , users.ensureMe          , users.update);
  app.post('/v1/users/:id/like/:sku'            , users.ensureMe          , users.like);
  app.post('/v1/users/:id/unlike/:sku'          , users.ensureMe          , users.unlike);
  app.post('/v1/users/:id/status'               , auth.ensureAdmin        , users.status);
  app.post('/v1/users/:id/password'             , users.ensureMe          , users.password);
  app.post('/v1/recover/:token/:email/password'                           , users.recover);
  
```
**Example:** http://api.karibou.evaletolab.ch/v1/users/me

#### Get product data
```
  #STATE  #ROUTE                                 #SECURITY                 #API (eg. rest filters)
  app.get('/v1/products/:sku'                                            , products.get);
  app.get('/v1/products'                                                 , products.list);
  app.get('/v1/products/category/:category'                              , products.list);
  app.get('/v1/products/location/:location'                              , products.list);
  app.get('/v1/products/category/:category/details/:details'             , products.list);
  app.get('/v1/products/location/:location/category/:category'           , products.list);
  app.get('/v1/products/location/:location/category/:category/details/:details' , products.list);
  app.post('/v1/products/:sku'                 , products.ensureOwnerOrAdmin
                                               , auth.ensureUserValid    , products.update);
  app.delete('/v1/products/:sku'               , products.ensureOwnerOrAdmin
                                               , auth.ensureUserValid    , products.remove);
```
**Example:** http://api.karibou.evaletolab.ch/v1/products?group=categories.name&sort=categories.weight

#### Get shop data
```
  #STATE  #ROUTE                                 #SECURITY                 #API
  app.get('/v1/shops'                                                     , shops.list);
  app.get('/v1/shops/category/:category'                                  , shops.list);
  app.get('/v1/shops/:shopname'                                           , shops.get);
  app.get('/v1/shops/:shopname/status'         , shops.ensureOwnerOrAdmin
                                               , auth.ensureUserValid     , shops.askStatus);
  app.get('/v1/shops/:shopname/products'                                  , products.list);
  app.get('/v1/shops/:shopname/products/category/:category'               , products.list);
  app.get('/v1/shops/:shopname/products/category/:category/details/:details', products.list);
  app.post('/v1/shops'                         , auth.ensureAuthenticated
                                               , auth.ensureUserValid
                                               , shops.ensureShopLimit    , shops.create);
  app.post('/v1/shops/:shopname'               , shops.ensureOwnerOrAdmin
                                               , auth.ensureUserValid     , shops.update);
  app.post('/v1/shops/:shopname/ask'           , auth.ensureUserValid     , shops.email);
  app.post('/v1/shops/:shopname/status'        , shops.ensureOwnerOrAdmin
                                               , auth.ensureUserValid     , shops.status);
  app.post('/v1/shops/:shopname/products'      , shops.ensureOwnerOrAdmin
                                               , auth.ensureUserValid     , products.create);
  app.delete('/v1/shops/:shopname'             , shops.ensureOwnerOrAdmin
                                               , auth.ensureUserValid     , shops.remove);
```



## License
The API is available under AGPL V3 to protect the long term interests of the community – you are free to use it with no restrictions but if you change the server code, then those code changes must be contributed back.

Copyright (c) 2012 Olivier Evalet (http://evaletolab.ch/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
