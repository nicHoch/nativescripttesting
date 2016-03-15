var webViewModule = require("ui/web-view");
var frameModule = require("ui/frame");
var viewModule = require("ui/core/view");
var webViewInterfaceModule = require('nativescript-webview-interface');
var oWebViewInterface;
var gestures = require("ui/gestures");
var RouteListViewModel = require("../../shared/view-models/route-list-view-model");

var itemsInView = [];
var topoisloaded = -1;
var items_visible = 10;
var pageData = {
    routes: [
        { name: "R1" , dif: "6a", topo: []},
        { name: "R2" , dif: "6b+", topo: [1]},
        { name: "R3" , dif: "6c", topo: [1]},
        { name: "R4" , dif: "6a", topo: [1]},
        { name: "R5" , dif: "5a", topo: [1]},
        { name: "R6" , dif: "4a", topo: [1,2]},
        { name: "R7" , dif: "7b", topo: [1,2]},
        { name: "R8" , dif: "6a+", topo: [2]},
        { name: "R9" , dif: "6a", topo: [2]},
        { name: "R10" , dif: "6c+", topo: [2]},
        { name: "R11" , dif: "8a", topo: [2]},
        { name: "R12" , dif: "9a", topo: []},
        { name: "R13" , dif: "4b", topo: []},
        { name: "R14" , dif: "1b", topo: [3]},
        { name: "R15" , dif: "2b", topo: [3]},
        { name: "R16" , dif: "3b", topo: [3]},
        { name: "R17" , dif: "4b", topo: [3]},
        { name: "R18" , dif: "5b", topo: [3]},
        { name: "R19" , dif: "6b", topo: [3]}
    ],

    itemSelected :  { name: "sel" , dif: "2b"}
};

var pageDataVM = new RouteListViewModel(pageData);

var page;

exports.loaded = function(args) {
    console.log("hello topoWebView");
    page = args.object;
    page.bindingContext = pageDataVM;
    setupWebViewInterface(page);
};



exports.onItemLoading = function(args) {
    console.log("onItemLoading: "+pageData.routes[args.index].name);

    var newsize = itemsInView.unshift(args.index);
    if (newsize > 100) itemsInView = itemsInView.slice(0,99);
    items_visible = Math.ceil(args.object.getMeasuredHeight()/args.view.getMeasuredHeight());
    updateTopos();
};

function updateTopos() {
    var lastitemsInView = itemsInView.slice(0,items_visible);
    var min = Math.min.apply(null, lastitemsInView);
    var max = Math.max.apply(null, lastitemsInView);
    min++;
    //max++;

    min=Math.max(min,0);
    max=Math.min(pageData.routes.length-1,max);

    console.log("items: " + items_visible + " < "+min+","+max+">");

    toposinlist = {}
    for (i = min; i <= max; i++) {
        pageData.routes[i].topo.forEach(function(entry) {
            toposinlist[entry]=true;
        });
    }
    var toposinlist = Object.keys(toposinlist).sort();
    console.log("Topos: "+toposinlist);
    page.getViewById('loadtopos1').isEnabled = false;
    page.getViewById('loadtopos2').isEnabled = false;
    page.getViewById('loadtopos3').isEnabled = false;

    toposinlist.forEach(function(topo) {
        var topobutton = page.getViewById('loadtopos'+topo);
        topobutton.isEnabled = true;
    });

    if (toposinlist.indexOf(topoisloaded)<0) {
        _loadtopo(toposinlist[0])
    }

}

exports.onItemTap = function(args) {
    console.log("onItemTap: "+args.index);
    console.log(pageData.routes[args.index].name);
    pageDataVM.itemSelected = pageData.routes[args.index];
};


exports.loadtopo = function(args) {
    var topo = args.object.text;
    _loadtopo(topo);
};

function _loadtopo(topo) {
    console.log("pushtoweb Topo: "+topo);
    var td = require("../../www/topodata.json");
    oWebViewInterface.emit('loadTopo', td.topos[topo-1]);
    topoisloaded = topo;
}

function setupWebViewInterface(page){
    var webView = page.getViewById('topowebview');
    oWebViewInterface = new webViewInterfaceModule.WebViewInterface(webView);

    webView.on(webViewModule.WebView.loadFinishedEvent, function (args) {
        var message;
        if (!args.error) {
            message = "WebView finished loading " + args.url;
        }
        else {
            message = "Error loading " + args.url + ": " + args.error;
        }
        console.log(message);

        updateTopos();
    });

    webView.src = '~/www/topo.html';

}

