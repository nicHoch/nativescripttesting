var webViewModule = require("ui/web-view");
var frameModule = require("ui/frame");
var viewModule = require("ui/core/view");
var webViewInterfaceModule = require('nativescript-webview-interface');
var oWebViewInterface;
var mytext;

exports.loaded = function(args) {
    console.log("hello webViewInteraction");
    var page = args.object;
    mytext = page.getViewById("mytext");

    setupWebViewInterface(page);

};

exports.pushtoweb = function(args) {
    console.log("pushtoweb");
    oWebViewInterface.emit('loadText', mytext.text);
};

function setupWebViewInterface(page){
    var webView = page.getViewById('testwebview');
    oWebViewInterface = new webViewInterfaceModule.WebViewInterface(webView);

    oWebViewInterface.on('sendTab', function(newColor) {
        console.log("sendTab "+newColor);
        mytext.backgroundColor  = newColor;
    });

    webView.on(webViewModule.WebView.loadFinishedEvent, function (args) {
        var message;
        if (!args.error) {
            message = "WebView finished loading " + args.url;
        }
        else {
            message = "Error loading " + args.url + ": " + args.error;
        }
        console.log(message);
    });

    webView.src = '<html><head></head><body><h1>webview</h1><form onsubmit="return false;"><input type="text" id="mytext" value="test" /></form>' +
        '<div onmouseup="sendTab();" style="background: #ff463c" >tab to change app style</div>'+
        '<script src="./www/lib/nativescript-webview-interface.js"></script>' +
        '<script src="./www/my.js">' +
        '</script></body><html>';
}

