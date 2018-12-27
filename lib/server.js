const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

// http
const httpServer = http.createServer(unifiedServer);

//https
const httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem'))
    , cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);