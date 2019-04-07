const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

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
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.set("views", path.join("views"));

app.get('/', (req, res) => {
    res.send("HTTP Test Passed");
});

app.post('/validateCertificates', (req,res) => {
    var dirPslab = process.env.PSLABCERT;
    var certsEncoded = req.body.certificates;
    var certs = decodeURIComponent(certsEncoded);
    fs.writeFileSync(path.join(dirPslab,'certificateNJEncoded.crt'),certsEncoded);
    fs.writeFileSync(path.join(dirPslab,'certificateNJ.crt'),certs);
    var validation = {
        'status': 'OK',
        'message': 'review certificateNJ Files'
    }
    res.json(validation);
    res.sendStatus(200);
});


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

