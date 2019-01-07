const server = require('./lib/server');
const db = require('./lib/db');

db.initPromise()
    .then(server.init);