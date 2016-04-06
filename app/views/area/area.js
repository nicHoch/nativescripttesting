var frameModule = require("ui/frame"); 
var Observable = require("data/observable").Observable;
var ObservableArray = require("data/observable-array").ObservableArray;

var pageData = new  Observable({
    node : {},
    title : "",
    areas : [],
    routes : [],
    isLoading : false   
});

var filters = {
    sta : function sta(args) {return "test";}
}
var page;

global.sta = function sta(args) {return "test";}
 

exports.navigatedTo  = function navigatedTo (args) { 
    console.log("navigatedTo"); 
    page = args.object;
    
    pageData.set("node",page.navigationContext.node);
    
    
    
    pageData.set("areas", page.navigationContext.children.filter(function(child) { return child.type === "area";}));
    pageData.set("routes", page.navigationContext.children.filter(function(child) { return child.type !== "area";}));
    
    pageData.set("title",page.navigationContext.node.subType+" "+page.navigationContext.node.name);
    
    //pageData.set("toStars", function(args) { var s=""; for (var i = 0; i < args*1 || 0; i++) {s+='★';}; return s; });
    
    page.bindingContext = pageData;
    
}

exports.pageLoaded = function pageLoaded(args) { 
     pageData.set("isLoading",false);

}

exports.loadNode = function loadNode(args) {
    var childNode = args.view.bindingContext;
    
    if (childNode.type != "annotation") {
         pageData.set("isLoading",true);
         global.tasksVM.add(childNode.id);
    } 
   /* else if (childNode.type == "route") {
        pageData.set("isLoading",true);
        var topmost = frameModule.topmost();  
        var navigationEntry = {
            moduleName : "views/route/route",
            context : {route : childNode}
        };
        topmost.navigate(navigationEntry);  
    }*/
}