/*

readme.js: example from the README

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

var Drifter = require('drifter-sender');

var drifter = new Drifter({
    capability: '02hAozGflu',
    hostname: 'localhost',
    path: '/1/log',
    port: 4443,
    rejectUnauthorized: false
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
// GET /1/log?02hAozGflu&uri=encoded&data=to_send HTTP/1.1\r\n
// Host: localhost\r\n
// \r\n

drifter.send("service=mysql&server=db15&unit=B&value=17");
// GET /1/log?02hAozGflu&service=mysql&server=db15&unit=B&value=17 HTTP/1.1\r\n
// Host: localhost\r\n
// \r\n
