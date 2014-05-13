# drifter-sender

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/drifter-sender.png)](http://npmjs.org/package/drifter-sender)

Send messages (logs, telemetry, or events) to [Drifter](https://github.com/tristanls/drifter).

## Overview

`drifter-sender` is a Node.js module for sending messages (logs, telemetry, or events) to [Drifter](https://github.com/tristanls/drifter). It encodes the message as a query string and issues an HTTPS GET request to the specified destination.

  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)

## Usage

```javascript
"use strict";

var Drifter = require('drifter-sender');

var drifter = new Drifter({
    capability: '02hAozGflu',
    hostname: 'localhost',
    port: 4443
});

// optionally listen for responses from Drifter (expect 503)
drifter.on('data', function (data) {
    console.log(data);
});

// optionally listen for errors from Drifter
drifter.on('error', function (error) {
    console.log(error);
});

// optionally listen for reported telemetry
drifter.on('telemetry', function (telemetry) {
    console.log(telemetry);
});

drifter.send("uri=encoded&data=to_send");
// GET /?02hAozGflu&uri=encoded&data=toSend HTTP/1.1\r\n
// Host: localhost\r\n
// \r\n

drifter.send("service=mysql&server=db15&unit=B&value=17");
// GET /?02hAozGflu&service=mysql&server=db15&unit=B&value=17 HTTP/1.1\r\n
// Host: localhost\r\n
// \r\n

```

## Tests

    npm test

## Documentation

  * [new Drifter(config)](#new-drifterconfig)
  * [drifter.connect()](#drifterconnect)
  * [drifter.send(data)](#driftersenddata)
  * [drifter.sendMessages()](#driftersendmessages)
  * [Event 'data'](#event-data)
  * [Event 'error'](#event-error)
  * [Event 'telemetry'](#event-telemetry)

### new Drifter(config)

* `config`: _Object_ _(Default: undefined)_
  * `capability`: _String_ The capability string to use.
  * `hostname`: _String_ Drifter hostname to connect to.
  * `port`: _Number_ _(Default: 443)_ Port to connect to.

Creates a new Drifter sender instance.

Drifter sender communicates only via TLS.

### drifter.connect()

_**CAUTION: reserved for internal use**_

Creates a TLS connection to `self.hostname:self.port` and sends all the messages in the buffer.

### drifter.send(message)

* `message`: _String_ URI encoded data to send. For example: "foo=bar", or
    "service=mysql&server=db15&unit=B&value=17"

Pushes `message` onto a local buffer to send to Drifter server. If a connection currently doesn't exist, it starts connecting. Once Drifter sender is connected, it sends all the messages in the buffer.

### drifter.sendMessages()

_**CAUTION: reserved for internal use**_

If there are messages in the buffer, sends the message to `self.hostname:self.port` via HTTPS over the currently open connection. The request looks like:

```
GET /?<self.capability>&<data> HTTP/1.1\r\n
HOST: <self.hostname>\r\n
\r\n
```

If there are more messages in the buffer to send, schedules the next invocation of `drifter.sendMessages()` via `setImmediate()`.

### Event: `data`

* `function (data) {}`
  * `data`: _String_ Any data returned by Drifter server.

Emitted when Drifter server acknowledges receipt of a message. Expected response is an HTTP response `HTTP/1.1 503 Service Unavailable` with associated headers.

### Event: `error`

* `function (error) {}`
  * `error`: _Object_ An error emitted by the TLS connection.
    * `code`: _String_ An error code. For example `ECONNREFUSED`.

Emitted when the TLS connection emits an error.

### Event: `telemetry`

* `function (telemetry) {}`
  * `telemetry`: _String_ A self-describing querystring encoded telemetry string.

Emitted when Drifter sender has telemetry to report. For example:

```
module=drifter-sender&module_version=0.0.0&target_type=timer&operation=secure_connect&unit=ns&value=3713603
```
