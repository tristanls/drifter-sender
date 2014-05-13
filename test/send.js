/*

send.js: send(data) test

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var Drifter = require('../index.js');
var fs = require('fs');
var https = require('https');
var path = require('path');
var url = require('url');

var test = module.exports = {};

test['sends message to host via TLS'] = function (test) {
    test.expect(3);
    var capability = "02hAozGflu";
    var message = "service=mysql&server=db15&unit=B&value=17";

    var options = {
        key: fs.readFileSync(path.normalize(path.join(__dirname, 'certs/server-key.pem'))),
        cert: fs.readFileSync(path.normalize(path.join(__dirname, 'certs/server-cert.pem')))
    };

    // allow self signed certs for testing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    var server = https.createServer(options, function (req, res) {
        test.equal(req.method, 'GET');
        test.equal(req.headers.host, 'localhost');
        var reqUrl = url.parse(req.url);
        test.equal(reqUrl.query, capability + '&' + message);
        res.writeHead(503);
        res.end();
        server.close(function () {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = undefined;
            test.done();
        });
    });

    server.listen(4443, function () {
        var drifter = new Drifter({
            capability: capability,
            hostname: 'localhost',
            port: 4443
        });
        drifter.on('error', function (error) {
            console.log(error);
        });
        drifter.send(message);
    });
};

test['sends multiple buffered messages to host via TLS'] = function (test) {
    test.expect(9);
    var capability = "02hAozGflu";
    var message1 = "service=mysql&server=db15&unit=B&value=17";
    var message2 = "service=mysql&server=db15&unit=B&value=18";
    var message3 = "service=mysql&server=db15&unit=B&value=19";
    var expected = [message1, message2, message3];
    var expectedIndex = 0;

    var options = {
        key: fs.readFileSync(path.normalize(path.join(__dirname, 'certs/server-key.pem'))),
        cert: fs.readFileSync(path.normalize(path.join(__dirname, 'certs/server-cert.pem')))
    };

    // allow self signed certs for testing
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    var sockets = [];

    var server = https.createServer(options, function (req, res) {
        test.equal(req.method, 'GET');
        test.equal(req.headers.host, 'localhost');
        var reqUrl = url.parse(req.url);
        test.equal(reqUrl.query, capability + '&' + expected[expectedIndex]);
        expectedIndex++;
        res.writeHead(503);
        res.end();
        if (expectedIndex == 3) {
            sockets.forEach(function (socket) {
                socket.destroy();
            });
            server.close(function () {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = undefined;
                test.done();
            });
        }
    });

    // keep track of all the sockets so we can close the server when we're done
    server.on('connection', function (socket) {
        sockets.push(socket);
    });

    server.listen(4443, function () {
        var drifter = new Drifter({
            capability: capability,
            hostname: 'localhost',
            port: 4443
        });
        drifter.on('error', function (error) {
            console.log(error);
        });
        drifter.send(message1);
        drifter.send(message2);
        drifter.send(message3);
    });
};

test['does not schedule connect() call multiple times'] = function (test) {
    test.expect(1);
    var capability = "02hAozGflu";
    var message1 = "service=mysql&server=db15&unit=B&value=17";
    var message2 = "service=mysql&server=db15&unit=B&value=18";
    var message3 = "service=mysql&server=db15&unit=B&value=19";

    var drifter = new Drifter({
        capability: capability,
        hostname: 'localhost',
        port: 4443
    });

    drifter.connect = function () {
        test.ok(true);
        test.done();
    };

    drifter.send(message1);
    drifter.send(message2);
    drifter.send(message3);
};
