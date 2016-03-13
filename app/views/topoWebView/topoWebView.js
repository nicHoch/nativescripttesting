var webViewModule = require("ui/web-view");
var frameModule = require("ui/frame");
var viewModule = require("ui/core/view");
var webViewInterfaceModule = require('nativescript-webview-interface');
var oWebViewInterface;

exports.loaded = function(args) {
    console.log("hello topoWebView");
    var page = args.object;

    setupWebViewInterface(page);

};

exports.loadtopo1 = function(args) {
    console.log("loadtopo(0)");
    loadtopo(0);
};

exports.loadtopo2 = function(args) {
    console.log("loadtopo(1)");
    loadtopo(1);

};


function loadtopo(idx) {
    console.log("pushtoweb");
    var td = require("../../www/topodata.json");
    oWebViewInterface.emit('loadTopo', td.topos[idx]);
};

function setupWebViewInterface(page){
    var webView = page.getViewById('topowebview');
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

    webView.src = '~/www/topo.html';

}

