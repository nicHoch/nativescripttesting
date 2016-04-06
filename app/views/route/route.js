var frameModule = require("ui/frame"); 
var Observable = require("data/observable").Observable;
var ObservableArray = require("data/observable-array").ObservableArray;

var pageData = new  Observable({
    route : {},
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
    var route = page.navigationContext.route;
    pageData.set("route", route);
    pageData.set("title", route.name+" "+ global.filters.toStars(route.stars) +" "+route.grade);
    
    pageData.set("userLogedin", global.user ? true : false);
    
    page.bindingContext = pageData;
    console.log(JSON.stringify(route));
   
}

exports.pageLoaded = function pageLoaded(args) { 
     pageData.set("isLoading",false);

} 

exports.logAscent = function logAscent(args) { 
     global.tasksVM.logAscent(pageData.route.id, global.user)
}
