const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const cors = require('cors')
const fs = require('fs');
const {SERVER_PORT} = require('./config');
const dbInit = require('./modules/database');

const app = express()
app.use(cors());
app.use(bodyParser.urlencoded({limit: '50mb', parameterLimit: 100000, extended: true}))
app.use(bodyParser.json({limit: '50mb'}));

const routes = require('./routes')(app);

(async () => {
    const db = await dbInit()

    let key = fs.readFileSync(__dirname + '/certs/private.key');
    let cert = fs.readFileSync(__dirname + '/certs/cert.crt');
    let options = {
        key: key,
        cert: cert
    };

    let server = https.createServer(options, app);
    server.listen(SERVER_PORT, () => {
        console.log("App starting on port: " + SERVER_PORT)
    });
    // app.listen(SERVER_PORT, () => console.log(`Service started on port ${SERVER_PORT}`));
})()

