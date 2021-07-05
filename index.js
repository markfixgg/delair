const express = require('express');
const bodyParser = require('body-parser');
const {SERVER_PORT} = require('./config');
const dbInit = require('./modules/database');

const app = express();
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

const routes = require('./routes')(app);

(async () => {
    const db = await dbInit()
    app.listen(SERVER_PORT, () => console.log(`Service started on port ${SERVER_PORT}`));
})()

