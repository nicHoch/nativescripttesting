var frameModule = require("ui/frame");


exports.pageLoaded = function pageLoaded(args) {
    var page = args.object;
    console.log("welcome to the main page");
}


exports.topoInWebViewAction = function() {
    var topmost = frameModule.topmost();
    topmost.navigate("views/topoWebView/topoWebView");
};

exports.webViewInteraction = function() {
    var topmost = frameModule.topmost();
    topmost.navigate("views/webViewInteraction/webViewInteraction");
};


