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
const tlsOptions = {
    key: fs.readFileSync(path.join('data/dada_key.pem')),
    cert: fs.readFileSync(path.join('data/dada.pem'))
};

buildUrl = (version, area) => `/api/${version}/${area}`;
const REQUESTS_BASE_URL = buildUrl('v1', 'requests');
console.log(REQUESTS_BASE_URL);


app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join("views"));

app.get('/approval', (req, res) => {
    res.send("HTTP Hello Test Passed");
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


app.get('/catalog/:catalogId/request/:requestId', async (req, res) => {
    try {
        var requestId = req.params.requestId;
        var catalogId = req.params.catalogId;
        var userInfo = await csa.getRequestDetails(catalogId, requestId);
        console.log('order');
        var options = {
            userInfo: userInfo
        }
        res.render('request', options);
        console.log('after rendering');
    }
    catch (err) {
        console.log(err);
        res.send(err);
    }
});



https.createServer(tlsOptions, app).listen(SSL_PORT, () => console.log(`Starting HTTPS server at port ${SSL_PORT}`));

