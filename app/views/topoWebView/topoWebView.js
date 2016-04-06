var webViewModule = require("ui/web-view");
var frameModule = require("ui/frame");
var viewModule = require("ui/core/view");
var webViewInterfaceModule = require('nativescript-webview-interface');
var oWebViewInterface;
var gestures = require("ui/gestures");
var RouteListViewModel = require("../../shared/view-models/route-list-view-model");
var Observable = require("data/observable").Observable;
var ObservableArray = require("data/observable-array").ObservableArray;
var itemsInView = [];


var items_visible = 10;


var routes = [
    { id: 100, name: "R1" , dif: "6a", topo: [], selected: true},
    { id: 101, name: "R2" , dif: "6b+", topo: [1], selected: false},
    { id: 102, name: "R3" , dif: "6c", topo: [1], selected: true},
    { id: 103, name: "R4" , dif: "6a", topo: [1], selected: false},
    { id: 104, name: "R5" , dif: "5a", topo: [1], selected: false},
    { id: 105, name: "R6" , dif: "4a", topo: [1,2], selected: false},
    { id: 106, name: "R7" , dif: "7b", topo: [1,2], selected: false},
    { id: 107, name: "R8" , dif: "6a+", topo: [1,2], selected: false},
    { id: 108, name: "R9" , dif: "6a", topo: [2], selected: false},
    { id: 109, name: "R10" , dif: "6c+", topo: [2], selected: false},
    { id: 110, name: "R11" , dif: "8a", topo: [2], selected: false},
    { id: 111, name: "R12" , dif: "9a", topo: [], selected: false},
    { id: 112, name: "R13" , dif: "4b", topo: [], selected: false},
    { id: 113, name: "R14" , dif: "1b", topo: [3], selected: false},
    { id: 114, name: "R15" , dif: "2b", topo: [3], selected: false},
    { id: 115, name: "R16" , dif: "3b", topo: [3], selected: false},
    { id: 116, name: "R17" , dif: "4b", topo: [3], selected: false},
    { id: 117, name: "R18" , dif: "5b", topo: [3], selected: false},
    { id: 118, name: "R19" , dif: "6b", topo: [3], selected: false}];

var routesWM = new ObservableArray(routes);

var pageData = new Observable({
    routes: routesWM,
    curTopo: -1
});



var page;

exports.loaded = function(args) {
    console.log("hello topoWebView");
    page = args.object;
    page.bindingContext = pageData;
    setupWebViewInterface(page);              
    
    pageData.on(Observable.propertyChangeEvent, function(args) {
        _loadtopo(pageData.get("curTopo"));    
    });
    
    pageData.set("curTopo",1);
    
    
};




exports.onItemLoading = function(args) {

    var newsize = itemsInView.unshift(args.index);
    if (newsize > 100) itemsInView = itemsInView.slice(0,99);
    var new_items_visible = Math.ceil(args.object.getMeasuredHeight()/args.view.getMeasuredHeight());
    if (isFinite(new_items_visible) && new_items_visible > 0) {
        items_visible = new_items_visible
        updateTopos();
    }

};

exports.onLoadedLW = function(args) {
    //updateTopos();
    console.log("LW loaded");
};


function updateTopos() {

    var lastitemsInView = itemsInView.slice(0,items_visible);
    var min = Math.min.apply(null, lastitemsInView);
    var max = Math.max.apply(null, lastitemsInView);
    min++;
    //max++;

    min=Math.max(min,0);
    max=Math.min(routes.length-1,max);

    //console.log("items: " + items_visible + " < "+min+","+max+">");

    toposinlist = {}
    for (i = min; i <= max; i++) {
        routes[i].topo.forEach(function(entry) {
            toposinlist[entry]=true;
        });
    }
    var toposinlist = Object.keys(toposinlist).sort();

    var found = false;
    toposinlist.forEach(function(topo) {
        var topobutton = page.getViewById('loadtopos'+topo);
        //topobutton.isEnabled = true;
        if (topo==pageData.get("curTopo")) found = true;
    });

    //console.log("Topos: "+toposinlist);
    //console.log("topoisloaded: "+topoisloaded);
    //console.log("IN?: "+found);
    if (!found) {
        pageData.set("curTopo",toposinlist[0]);
    }

}

exports.btnLoaded = function (args) {
    var btn = args.object;
    btn.android.setFocusable(false);
};

exports.onItemTab = function(args) {
    console.log("onItemTap: "+args.index);



    routes[args.index].selected = !routes[args.index].selected;
    routesWM.setItem(args.index,routes[args.index]);

    //routesWM.getItem(args.index).selected = !routesWM.getItem(args.index).selected;

    oWebViewInterface.emit('selectNode', routes[args.index]);
    //page.getViewById('routelist').refresh();


    console.log("ENDE onItemTap: "+args.index);
};

//exports.checkBoxTab = function(args) {
//    console.log("checkBoxTab: "+args.index);
//    pageData.routes[args.index].selected = !pageData.routes[args.index].selected;
//
//};
 

exports.loadtopo = function(args) {
    var topo = args.object.text;
    _loadtopo(topo);
};

function _loadtopo(topo) {
    console.log("pushtoweb Topo: "+topo);
    //var td = require("../../www/topodata.json");
    var topodata =  global.theCragDB.topos.by('id', topo);
    oWebViewInterface.emit('loadTopo', topodata);
    topoisloaded = topo;

    routes.forEach(function(node) {
        oWebViewInterface.emit('selectNode', node);
    });
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

        _loadtopo(1);

    });

    webView.src = '~/www/topo.html';

}

