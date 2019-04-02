const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const app = express();
const morgan = require('morgan');
const requestsRouter = require('./routes/requests.js');
const csa = require('./csa.js');


const PORT = 3333;
const SSL_PORT = 3334;
const tlsOptions = {
    key: fs.readFileSync(path.join('data/key.pem')),
    cert: fs.readFileSync(path.join('data/certificate.pem'))
};

buildUrl = (version, area) => `/api/${version}/${area}`;
const REQUESTS_BASE_URL = buildUrl('v1', 'requests');
console.log(REQUESTS_BASE_URL);


app.use(morgan('tiny'));
app.set("view engine", "ejs");
app.set("views", path.join("views"));
app.use(REQUESTS_BASE_URL, requestsRouter);

app.get('/', (req, res) => {
    res.send("HTTP Test Passed");
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

/*app.get('/catalog/:catalogId/request/:requestId', (req, res) => {
    var requestId = req.params.requestId;
    var catalogId = req.params.catalogId;
    var out = csa.getRequestDetails(catalogId, requestId)
        .then(order => resolve({ order: order }))
        .then(options => res.render('request', options))
        .catch(err => res.send(err));
    console.log(out);
});*/


https.createServer(tlsOptions, app).listen(SSL_PORT, () => console.log(`Starting HTTPS server at port ${SSL_PORT}`));

