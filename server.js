const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const multer = require('multer');
const exec = require('child_process').exec;
const csa = require('./csa.js');
const upload = multer({});
const DMJ_PATH = process.env.DMJ_PATH || '/dmj';
const DMJ_PORT = process.env.DMJ_PORT || 3334;
const DMJ_HOST = process.env.DMJ_HOST || 'localhost';
const BASE_URL = `https://${DMJ_HOST}:${DMJ_PORT}${DMJ_PATH}`;

// Create secrets
const tlsOptions = {
    key: fs.readFileSync(path.join(`secrets/key.pem`)),
    cert: fs.readFileSync(path.join(`secrets/server.pem`))
};

app.use(`${DMJ_PATH}/static`, express.static('./public'));

app.use(morgan('tiny'));
// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));


app.set("view engine", "ejs");
app.set("views", path.join("views"));

app.get(`${DMJ_PATH}`, async (req, res) => {
    try {
        var data = await csa.listScripts();
        res.render('javascriptstore', { data: data, DMJ_PATH: DMJ_PATH, baseUrl: BASE_URL });
    }
    catch (error) {
        res.status(500).send(error);
    }
});

// testing form in browser
app.get(`${DMJ_PATH}/test`, (req, res) => {
    res.render('test');
});

// multipart/form-data processed by multer
app.post(`${DMJ_PATH}/upload`, upload.single('script'), async (req, res) => {
    try {
        var scriptName = req.body.scriptName || req.file.originalname;
        var overwrite = ( req.body.scriptName )? 'true': 'false';
        var buffer = req.file.buffer;     
        var out = await csa.updateScript(buffer,scriptName,overwrite);
        res.status(200).send('out');
    }
    catch (error) {
        console.log("ERROR: " + error);
        res.status(500).send(error);
    }
});

app.delete(`${DMJ_PATH}/:scriptName`, async (req, res) => {
    try {
        var scriptName = req.params.scriptName;
        var scriptBody = await csa.removeScript(scriptName);
        res.send(scriptBody);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

app.get(`${DMJ_PATH}/:scriptName`, async (req, res) => {
    try {
        var scriptName = req.params.scriptName;
        var scriptBody = await csa.getScript(scriptName);
        res.send(scriptBody);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

https.createServer(tlsOptions, app).listen(DMJ_PORT, () => console.log(`Starting HTTPS server at port ${DMJ_PORT}`));
