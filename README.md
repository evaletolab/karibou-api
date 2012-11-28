# Karibou-api
Your open-source commerce. Backend part.

## Getting started
This is a backend part of the futur [karibou.*] application.

    $ git clone https://github.com/evaletolab/karibou-api.git
    $ cd karibou-api
    $ npm install
    
Testing

    $ sudo npm -g install mocha
    $ mocha

Running    

    $ node app


## API
Current API version is v1. You need to prepend `v1/` to app requests except auth.

* [Users](#users-api)
* [Stores](#stores-api)
* [Topics](#topics-api)
* [Products](#products-api)
* [Orders](#order-api)

### Auth
All requests that change state (`POST`, `PUT`, `DELETE`) require authentication.

Currently only authentication via `GET` param is supported.

Just add `?access_token=x` to your URLs. Access token can be get when user
logs in (any request to `/auth/twitter`).

### Users API
`:username` is a user name user has on twitter.

#### Get user data
`GET /users/:username`
`GET /users/me`

**Example:** http://api.karibou.io/v1/users/evaleto

#### Delete user
`DELETE /users/:username`

### Stores API
`:store_name` is a store name.

#### List available stores
`GET /stores/`

#### Get store data
`GET /stores/:store_name`

**Example:** http://api.karibou.io/v1/stores/bicycle-and-technologies

#### Create a new Store
`POST /users/:username/stores/`

#### Modify a Store
`PUT /users/:username/stores/:store_name`


### Products API
`:product_name` is a product.

#### List available products
`GET /products/`

#### Get product data
`GET /products/:produc_name`

#### List products by store
`GET /stores/:store_name/products/`

**Example:** http://api.karibou.io/v1/stores/bicycle-and-technologies/products

### Topics API
`:topic_name` is a string.

#### List topics by store, username, all
`GET /users/:username/stores/:store_name/topics/`
`GET /users/:username/topics/`
`GET /topics/`

**Example:** http://api.karibou.io/v1/users/evaleto/stores/bicycle/topics/
**Example:** http://api.karibou.io/v1/users/evaleto/topics/

#### Create new topic
`POST /users/:username/topics/`

Input:

* **title**: *Required* **string**

#### Get products by topics
`GET /topics/:topic_name`

**Example:** http://api.karibou.io/v1/topics/motor

#### Get products by store and topics
`GET /stores/:store_name/topics/:topic_name`

**Example:** http://api.karibou.io/v1/stores/bicycle-and-technologies/topics/motor

#### Modify topic
`PUT /users/:username/stores/:store_name/topics/:topic_name`

Input:

* **title**: *Required* **string*&

#### Delete topic
`DELETE /users/:username/stores/:store_name/topics/:topic_name`

### products API
### List topic products
`GET /users/:username/stores/:store_name/topics/:topic_name/products/`

**Example:** http://api.karibou.io/v1/users/evaleto/stores/ostio/topics/1/products/

#### Create new product
`POST /users/:username/stores/:store_name/topics/:topic_name/products/`

Input:

* **text**: *Required* **string*

#### Get product data
`GET /users/:username/stores/:store_name/topics/:topic_name/products/:id`

**Example:** http://api.karibou.io/v1/users/evaleto/stores/ostio/topics/1/products/8

#### Modify product
`PUT /users/:username/stores/:store_name/topics/:topic_name/products/:id`

Input:

* **text**: *Required* **string*

#### Delete product
`DELETE /users/:username/stores/:store_name/topics/:topic_name/products/:id`

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
