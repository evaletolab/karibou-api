# Karibou-api
Karibou.ch is an open-source project aim to help the creation of an 
online community marketplace. Our goal is to allow local food producers, artisans and artists 
to sell their products locally. There is alpha frontend available here http://karibou.evaletolab.ch/

[![David](https://img.shields.io/david/karibou-ch/karibou-api.svg?style=flat)](https://david-dm.org/evaletolab-ch/karibou-api)
[![Build Status](https://travis-ci.org/karibou-ch/karibou-api.svg?branch=master)](https://travis-ci.org/evaletolab-ch/karibou-api)
<a href="https://gitter.im/karibou-ch/?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge"><img src="https://badges.gitter.im/Join Chat.svg" alt="Gitter chat" height="20"></a>

## Getting started
This is a backend part of the futur [karibou.*] application.

    $ git clone https://github.com/evaletolab-ch/karibou-api.git
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



## Copyright & dual License 
<!--
4. You may not use the work for some commercial purposes — unless you get the Karibou's permission. 
 * You can sell copies of the software, 
 * **YOU CAN NOT USE THE SOFTWARE TO BUILD A ONLINE GROCERY STORE WITHOUT THE KARIBOU PERMISSION.**
-->

* Copyright (c) 2015 Karibou.ch (http://karibou.ch/)
* Copyright (c) 2012 Olivier Evalet (http://evaletolab.ch/)

Karibou is distributed under a dual license: an open source license, and a commercial license. The open source license under which Karibou API is distributed is the AGPL V3 to protect the long term interests of the community – you are free to use it with no restrictions but if you change the server code, then those code changes must be contributed back. **it means,**

1. If you run a modified program on a server and let other users contact him, your server should also allow them to download the source code for the version amended in operation. 
2. The download link must be visible and accessible from the footer website, 
3. The download link should also display the copyright holder  : developped with :green_heart: by Karibou.ch

For anyone who wants to develop and use but does not want to release the source code for their application, Karibou is able to provide a commercial licence. You have to contact [Karibou](license@karibou.ch) to get a commercial license.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

**The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.**


THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

* more reading http://www.gnu.org/licenses/gpl-violation.fr.html http://www.gnu.org/licenses/why-affero-gpl.fr.html
