var fetchModule = require("fetch");
var Observable = require("data/observable").Observable;
var config = require("~/shared/config");

function User(info) {
    info = info || {};

    // You can add properties to observables on creation
    var viewModel = new Observable({
        loginname: info.login || "",
        password: info.password || ""
    });

    viewModel.login = function() {
        return fetchModule.fetch(config.oAuthUrl(), {
                method: "POST",
                body: JSON.stringify({data : {
                    username: viewModel.get("loginname"),
                    password: viewModel.get("password"),
                    key : config.apiKey,
                    //scope: config.apiScope,
                    //client_id: config.appId,
                    //client_secret: config.oauthSecretKey,
                    //grant_type: "password"
                }}),
                headers: {
                    "Content-Type": "application/json",
                    "X-CData-Key": "key="+config.apiKey
                }
            })
            .then(handleErrors)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.status != 'success') {
                    global.user = null;
                    global.theCragDB.user.removeDataOnly();
                    throw Error(data.message);
                } else {
                    global.user = data; 
                    global.user.loginname = viewModel.get("loginname");
                    global.setNotification("Welcome", viewModel.get("loginname"));
                    global.theCragDB.user.removeDataOnly();
                    var u = global.theCragDB.user.insert(JSON.parse(JSON.stringify(global.user)));
                }    
            }); 
    };

    return viewModel;
}

function handleErrors(response) {
    if (!response.ok) {
        console.log(JSON.stringify(response));
        throw Error(response.statusText);
    }
    return response;
}

module.exports = User;