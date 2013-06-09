# Karibou-api
Karibou is an open-source projects aim to help the creation of a online community marketplace. Karibou-api is the backend part. 

## Getting started
This is a backend part of the futur [karibou.*] application.

    $ git clone https://github.com/evaletolab/karibou-api.git
    $ cd karibou-api
    $ npm install
    $ edit config-devel|test.js
    $ mongod
    
Testing

    $ sudo npm -g install mocha
    $ make

Running    

    $ node app


## API
Current API version is v1. You need to prepend `v1/` to app requests except auth.

* [Users](#users-api)
* [Shops](#stores-api)
* [Category](#topics-api)
* [Products](#products-api)
* [Orders](#order-api)
* backend, http://karibou-api.cloudfoundry.com/v1
* frontend, http://karibou.evaletolab.ch/
* 

### Auth
All requests that change state (`POST`, `PUT`, `DELETE`) require authentication.

### Users API
`:username` is a user name user has on twitter.

#### Get user data
```
GET /users/:username
GET /users/me
```
**Example:** http://karibou-api.cloudfoundry.com/v1/users/me


## License
The MIT License (MIT)

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
