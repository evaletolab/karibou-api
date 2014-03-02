// node.js proxy server example for adding CORS headers to any existing http services.
// yes, i know this is super basic, that's why it's here. use this to help understand how http-proxy works with express if you need future routing capabilities

var httpProxy = require('http-proxy'),
	express = require('express');
		
var proxy = new httpProxy.RoutingProxy();

var proxyOptions = {
	host: '192.168.3.11',
	port: 8080
};

var app = express.createServer();

var allowCrossDomain = function(req, res, next) {
    console.log('allowingCrossDomain');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization, X-Mindflash-SessionID');
	  
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.configure(function() {
    app.use(allowCrossDomain);
});

app.all('/*',  function (req, res) {
    return proxy.proxyRequest(req, res, proxyOptions);
});

app.listen(9000);

console.log('#########\nListening on 9000\n##########');