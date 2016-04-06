var frameModule = require("ui/frame");
var LocalNotifications = require("nativescript-local-notifications");
//require( 'nativescript-webworkers' );
var TasksViewModel = require("~/shared/view-models/tasks-view-model");
global.tasksVM = new TasksViewModel();

global.Task = require("~/shared/util/taskFactory");

exports.pageLoaded = function pageLoaded(args) {
    
    var page = args.object; 
    console.log("welcome to the main page");
    if (!global.tasksWorker) {
        global.tasksWorker = require("~/shared/util/tasksWorker");
    }
    page.bindingContext = {loginname : global.user ? global.user.loginname : ''} ; 
}

exports.addNoti = function() {
    global.setNotification("new Notification","test "+new Date().getTime());
}

exports.addTask = function() {
    global.tasksVM.add();
}

exports.viewRoute = function() {
    global.tasksVM.add("587185725");
}



exports.login = function() {
    var topmost = frameModule.topmost();
    topmost.navigate("views/login/login");
}

exports.viewTasks = function() {
    var topmost = frameModule.topmost();
    topmost.navigate("views/tasks/tasks");
};

exports.topoInWebViewAction = function() {
    var topmost = frameModule.topmost();
    topmost.navigate("views/topoWebView/topoWebView");
};

exports.webViewInteraction = function() {
    var topmost = frameModule.topmost();    
    topmost.navigate("views/webViewInteraction/webViewInteraction");
};

exports.showSplit = function() {
    var topmost = frameModule.topmost();    
    topmost.navigate("views/splitView/splitView"); 
};


