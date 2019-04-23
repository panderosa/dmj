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
var upload = multer({});
const atob = require('atob');

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
    try {
        var data = await csa.listScripts();
        res.render('javascriptstore', { data: data, baseUrl: 'https://luca.koty.pl:3334/approval/javascriptstore' });
    }
    catch (error) {
        res.status(500).send(error);
    }
});


app.get('/approval/javascriptstore/update', (req, res) => {
    res.render('upload');
});

// multipart/form-data processed by multer
app.post('/approval/javascriptstore/update', upload.single('script'), async (req, res) => {
    try {
        var scriptName = req.body.scriptName;
        console.log(`Script Name: ${scriptName}`)
        console.log(req.file);
        var buffer = req.file.buffer;        
        fs.writeFileSync(`c:/tmp/output_${scriptName}`, buffer);
        var out = await csa.updateScript(req.body.scriptName,buffer);
        res.status(200).send('out');
    }
    catch (error) {
        console.log("ERROR: " + error);
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

