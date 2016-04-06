
var gestures = require("ui/gestures");
var platformModule = require("platform");
var viewModule = require("ui/core/view");
var Observable = require("data/observable").Observable;
var application = require("application");
var enums = require('ui/enums');
var tabViewModule = require("ui/tab-view");
var imageModule = require("ui/image");
var labelModule = require("ui/label");
var webViewModule = require("ui/web-view");
var stackLayoutModule = require("ui/layouts/stack-layout");
var webViewInterfaceModule = require('nativescript-webview-interface');
  
var oWebViewInterface;

var pageData = new Observable({
    orientation : "vertical",
    norientation : "horizontal",
    lHeight : 48,
    lWidth : 100, 
    rHeight : 48,
    rWidth : 100, 
    sHeight : 4,
    sWidth : 100,
    curTopo : 1,
    maxTopo : 3,
    names : ["a","b","c","d","e","a","b","c","d","e","a","b","c","d","e","a","b","c","d","e","a","b","c","d","e","a","b","c","d","e","a","b","c","d","e"]
});

var screenX = 100.0;
var screenY = 100.0;
 
exports.loadTopo = function() {
    console.log("loadTopo");
    _loadtopo(((topo.lastTopoTab-1)%3)+1);
}
  
exports.toposwipe = function toposwipe(args) {
    console.log("toposwipe");
}
     
exports.pageLoaded = function pageLoaded(args) {
       
    var page = args.object;
    page.bindingContext = pageData;
    var splitter = page.getElementById("splitter");
    var tabView = page.getElementById("tabView");
    setupWebViewInterface(page);
     
    screenX = platformModule.screen.mainScreen.widthPixels * 1.0;
    screenY = platformModule.screen.mainScreen.heightPixels * 1.0;
     
    console.log("Screen: "+screenX+","+screenY);
    
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

function _loadtopo(topo) {
    console.log("pushtoweb Topo: "+topo);
    var topodata =  global.theCragDB.topos.by('id', topo);
    oWebViewInterface.emit('loadTopo', topodata);
} 

exports.splitterpan = function splitterpan(args) {
    //console.log("Pan deltaX:" + args.deltaX + "; deltaY:" + args.deltaY + "; "+application.getOrientation());
    var delta = 0;
    if(application.getOrientation() == enums.DeviceOrientation.landscape) {
        delta = (args.deltaX / screenX)*100.0; 
        pageData.set("lWidth",Math.min(pageData.get("lWidth")+delta,96));
        pageData.set("rWidth",Math.max(pageData.get("rWidth")-delta,0,001));
    } else { 
        delta = (args.deltaY / screenY)*100.0;
        pageData.set("lHeight",Math.min(pageData.get("lHeight")+delta,96));
        pageData.set("rHeight",Math.max(pageData.get("rHeight")-delta,0,001));
    }
    //console.log("Pan "+delta);
} 

exports.splitterswipe = function splitterswipe(args) {
        //console.log("swipe "+args.direction);
        if(application.getOrientation() == enums.DeviceOrientation.landscape) {
        if (args.direction == 2) {
            //console.log("swipe left");
            pageData.set("lWidth",0.001);
            pageData.set("rWidth",96);
        } 
        
        if (args.direction == 1) {
            //console.log("swipe right");
            pageData.set("lWidth",96);
            pageData.set("rWidth",0.001);
        }
    } else { 
        if (args.direction == 4) {
            //console.log("swipe up");
            pageData.set("lHeight",0.001);
            pageData.set("rHeight",96);
        } 
        
        if (args.direction == 8) {
            //console.log("swipe down");
            pageData.set("lHeight",96);
            pageData.set("rHeight",0);
        }
        
    }
}

exports.orientation = function(args) {
    
    if (args.landscape) {
        pageData.set("lHeight",100);
        pageData.set("lWidth",48);
        pageData.set("rHeight",100);
        pageData.set("rWidth",48);
        pageData.set("sHeight",100);
        pageData.set("sWidth",4);
        pageData.set("orientation", "horizontal");
        pageData.set("norientation", "vertical");
    } else {
        pageData.set("lHeight",48);
        pageData.set("lWidth",100);
        pageData.set("rHeight",48); 
        pageData.set("rWidth",100);
        pageData.set("sHeight",4);
        pageData.set("sWidth",100);
        pageData.set("orientation", "vertical");
        pageData.set("norientation", "horizontal");
    }

    
    console.log(pageData.get("orientation"));
} 