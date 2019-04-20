const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const exec = require('child_process').exec;
const csa = require('./csa.js');


const SSL_PORT = 3334;
// Create secrets
const tlsOptions = {
    key: fs.readFileSync(path.join(`secrets/key.pem`)),
    cert: fs.readFileSync(path.join(`secrets/server.pem`))
};

app.use('/approval/static', express.static('./public'));

app.use(morgan('tiny'));
// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join("views"));

app.get('/approval', (req, res) => {
    res.send("HTTP Hello Test Passed");
});


app.get('/approval/javascriptstore', async (req, res) => {
    var data = await csa.listScripts();
    res.render('javascriptstore', { data: data, baseUrl: 'https://luca.koty.pl:3334/approval/javascriptstore' });
});

app.post('/approval/javascriptstore/update/:scriptName', async (req, res) => {
    try {
        console.log('initiated');
        var scriptName = req.params.scriptName;
        var content = req.body.content;
        fs.writeFileSync(path.join('c:/temp/update.js'),content);
        res.status(200).send('OK');
    }
    catch (error) {
        res.status(500).send(error);
    }
});

app.get('/approval/javascriptstore/:scriptName', async (req, res) => {
    try {
        var scriptName = req.params.scriptName;
        var scriptBody = await csa.getScript(scriptName);
        res.send(scriptBody);
    }
    catch (error) {
        res.status(500).send(error);
    }
});



app.get('/approval/validateCertificates', (req, res) => {
    res.render('validate');
});

// Validate OpenSSH public keys
app.post('/approval/validateCertificates', async (req, res) => {
    var validation;
    try {
        var dirPslab = (process.env.PSLABCERT) ? process.env.PSLABCERT : (process.platform === "win32") ? 'c:/tmp' : '/tmp';
        var certs = req.body.certificates;
        var file = path.join(dirPslab, `tmp_${Date.now()}.crt`);
        fs.writeFileSync(file, certs);
        validation = await runValidation(file);
    }
    catch (error) {
        console.log(`ERROR: ${error}`);
        validation = {
            'status': 'ERROR',
            'message': 'Key Validation Failed'
        }
    }
    res.json(validation);
});

async function runValidation(file) {
    return new Promise((resolve, reject) => {
        var runscript = exec(`ssh-keygen -l -v -f ${file}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                console.log(`STDOUT: ${stdout}`);
                console.log(`STDERR: ${stderr}`);
                resolve({
                    'status': 'OK',
                    'message': 'Key Validation Passed'
                });
            }
        });
    });
}

//app.listen(3333,() => console.log("Starting server at port 3333"));

https.createServer(tlsOptions, app).listen(SSL_PORT, () => console.log(`Starting HTTPS server at port ${SSL_PORT}`));

