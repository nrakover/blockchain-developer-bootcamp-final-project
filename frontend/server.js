'use strict';

const path = require('path');
const express = require('express');

const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3000;
const CLIENT_BUILD_DIR = process.env.CLIENT_BUILD_PATH;

const app = express();

app.use(express.static(CLIENT_BUILD_DIR));

app.get('/', function (req, res) {
    res.sendFile(path.join(CLIENT_BUILD_DIR, 'index.html'));
});

app.listen(PORT);
console.log(`Listening on ${PORT}`);
