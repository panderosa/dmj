const request = require('request');
const fs = require('fs');
const path = require('path');
const env = JSON.parse(fs.readFileSync('secrets/accounts.json'));

function getBasicAuth(user, password) {
    return "Basic " + Buffer.from(`${user}:${password}`).toString('base64');
}

sendRequest = async (options) => {
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
                    var out = `status code: ${res.statusCode}\n body: ${rp}`;
                    reject(out);
                }
            }
        });
    })
}


 getUserIdentifier = async (tenant, user) => {
    var url = env.uri.rest + `/${tenant}/${user}`;
    var auth = getBasicAuth('csaTransportUser', env.csa.csaTransportUser);
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
    return await sendRequest(options);

}


listScripts = async () => {
    var url = env.uri.api + `/javascriptstore`;
    var auth = getBasicAuth('admin', env.csa.admin);
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

    return await sendRequest(options);
}

module.exports = {
    listScripts
}