/*

index.js: Drifter sender module

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

var events = require('events');
var tls = require('tls');
var url = require('url');
var util = require('util');

var TELEMETRY_MODULE = 'drifter-sender';
var TELEMETRY_MODULE_VERSION = require('./package.json').version;
var TELEMETRY_SECURE_CONNECT = 'module=' + TELEMETRY_MODULE
    + '&module_version=' + TELEMETRY_MODULE_VERSION
    + '&target_type=timer'
    + '&operation=secure_connect'
    + '&unit=ns'
    + '&value=';

/*
  * `config`: _Object_ _(Default: undefined)_
    * `capability`: _String_ The capability string to use.
    * `hostname`: _String_ Drifter hostname to connect to.
    * `path`: _String_ Drifter path to connect to.
    * `port`: _Number_ _(Default: 443)_ Port to connect to.
*/
var Drifter = module.exports = function Drifter(config) {
    var self = this;
    events.EventEmitter.call(self);

    config = config || {};

    self.buffer = [];
    self.capability = config.capability;
    self.connecting = false;
    self.connection = null;
    self.hostname = config.hostname;
    self.path = config.path;
    self.port = config.port;
    self.timers = {
        secureConnect: null
    };
};

util.inherits(Drifter, events.EventEmitter);

/*
  _**CAUTION: reserved for internal use**_

  Creates a TLS connection to self.hostname:self.port
*/
Drifter.prototype.connect = function connect() {
    var self = this;

    self.timers.secureConnect = process.hrtime();
    self.connection = tls.connect(self.port, self.hostname);
    self.connecting = false; // done connecting;
    self.connection.setEncoding('utf8');

    self.connection.on('secureConnect', function () {
        var diff = process.hrtime(self.timers.secureConnect);
        var time = diff[0] * 1e9 + diff[1];
        self.emit('telemetry', TELEMETRY_SECURE_CONNECT + time);
        self.sendMessages();
    });
    self.connection.on('data', function (data) {
        self.emit('data', data);
    });
    self.connection.on('error', function (error) {
        self.emit('error', error);
        if (error.code == "ECONNREFUSED") {
            // FIXME: implement exponential backoff
        }
    });
    self.connection.on('end', function () {
        // reset timers in progress
        self.timers.secureConnect = null;

        // FIXME: implement exponential backoff
        if (self.buffer.length > 0) {
            setImmediate(self.connect.bind(self));
        } else {
            self.connection = null;
        }
    });
};

/*
  * `message`: _String_ URI encoded data to send. For example: `foo=bar`, or
      `service=mysql&server=db15&unit=B&value=17`
*/
Drifter.prototype.send = function send(message) {
    var self = this;

    self.buffer.push(message);

    if (!self.connection && !self.connecting) {
        self.connecting = true; // prevent scheduling connect() many times
        setImmediate(self.connect.bind(self));
    }
};

/*
  _**CAUTION: reserved for internal use**_

  Sends messages to self.hostname:self.port via HTTPS:
  GET <self.path>?<self.capability>&<message> HTTP/1.1\r\n
  HOST: <self.hostname>\r\n
  \r\n
*/
Drifter.prototype.sendMessages = function sendMessages() {
    var self = this;

    // FIXME: reset exponential backoff

    if (self.buffer.length == 0) {
        return;
    }

    var message = self.buffer.shift();

    self.connection.write('GET ' + self.path + '?' + self.capability + '&' +
        message + ' HTTP/1.1\r\n');
    self.connection.write('Host: ' + self.hostname + '\r\n');
    self.connection.write('\r\n');

    if (self.buffer.length > 0) {
        setImmediate(self.sendMessages.bind(self));
    } else {
        self.connection.end();
    }
};
