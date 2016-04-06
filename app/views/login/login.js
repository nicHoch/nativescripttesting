var viewModule = require("ui/core/view");
var frameModule = require("ui/frame");
var UserViewModel = require("../../shared/view-models/user-view-model");
var user = new UserViewModel({
    login: "nickyhochmuth",
    password: ""
});
var dialogsModule = require("ui/dialogs");

exports.loaded = function(args) {
    var page = args.object;
    page.bindingContext = user;
};

exports.signIn = function() {

    user.login()
        .catch(function(error) {
            console.log(error);
            dialogsModule.alert({
                message: error.message,
                okButtonText: "OK"
            });
            return Promise.reject();
        })
        .then(function() {
            console.log("OK");
            frameModule.topmost().navigate("views/main/main-page");
        });
};
