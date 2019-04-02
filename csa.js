const request = require('request');
const fs = require('fs');
const path = require('path');
const configFile = "data/configuration.json";
const suite = "AMS";
let env;

function initConfig() {
    return new Promise((resolve, reject) => {
        fs.readFile(configFile, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                env = JSON.parse(data.toString());
                resolve(env);
            }
        });
    });
}

function getLegacyAuth(suite, env) {
    return "Basic " + Buffer.from("csaTransportUser:" + env[suite]['login']['csaTransportUser']).toString('base64');
}


function getUserIdentifier(suite, env, org, userName) {
    var url = env[suite]['service']['legacy'] + `/login/${org}/${userName}`;
    var auth = getLegacyAuth(suite, env);
    var options = {
        url: url,
        rejectUnauthorized: false,
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": auth
        },
        json: true
    };

    //console.log("options => " + JSON.stringify(options));

    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
            if (!err && (res.statusCode === 200 || res.statusCode === 201)) {
                resolve(body.id);
            }
            else {
                if (err) {
                    reject(err);
                }
                else {
                    var rp = JSON.stringify(res.body);
                    var out = `status code: ${res.statusCode}\n \
body: ${rp}`
                    reject(out);
                }
            }
        });
    })
}


function getRequest(suite, env, catalogId, requestId, userIdentifier) {
    var url = env[suite]['service']['legacy'] + `/catalog/${catalogId}/request/${requestId}?userIdentifier=${userIdentifier}`;
    var auth = getLegacyAuth(suite, env);
    var options = {
        url: url,
        rejectUnauthorized: false,
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": auth
        },
        json: true
    };

    //console.log("options => " + JSON.stringify(options));

    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
            if (!err && (res.statusCode === 200 || res.statusCode === 201)) {
                resolve(body);
            }
            else {
                if (err) {
                    reject(err);
                }
                else {
                    var rp = JSON.stringify(res.body);
                    var out = `status code: ${res.statusCode}\n \
    body: ${rp}`
                    reject(out);
                }
            }
        });
    })
}


async function getRequestDetails(catalogId, requestId) {
    var out;
    try {
        var env = await initConfig();
        var userIdentifier = await getUserIdentifier(suite, env, 'AMS_PS_LAB', 'malinowd');
        console.log('before order');
        var order = await getRequest(suite, env, catalogId, requestId, userIdentifier);

        console.log('after order');
        out = {
            id: order.createdBy.id,
            name: order.createdBy.name,
            displayName: order.createdBy.displayName
        }
    }
    catch (err) {
        out = {
            error: err
        }
    }
    return out;
}

/*async function getRequestDetails(catalogId, requestId) {
    initConfig()
    .then(() => getUserIdentifier(suite, env, 'AMS_PS_LAB', 'malinowd'))
    .then(uid => getRequest(suite, env, catalogId, requestId, uid))
    .catch(err => Promise.reject(err));
}*/

//getRequestDetails('9a391e02f9df47c5ad9487ae7f77eee0', '2c90958969ba44990169cb41f0e879cb');
//console.log('poszly konie po betonie')


module.exports = {
    getRequestDetails
}