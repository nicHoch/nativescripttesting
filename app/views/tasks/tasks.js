var frameModule = require("ui/frame");
var Observable = require("data/observable").Observable;
var ObservableArray = require("data/observable-array").ObservableArray;


var pageData = new Observable({
    tasks: global.tasksVM
});



function refreshList(args) {
    // Get reference to the PullToRefresh;
    var pullRefresh = args.object;
    global.tasksVM.empty();
    global.tasksVM.load();
    pullRefresh.setRefreshing(false);
}
exports.refreshList = refreshList;



exports.pageLoaded = function pageLoaded(args) { 
    var page = args.object; 
    page.bindingContext = pageData;
    global.tasksVM.empty();
    global.tasksVM.load(); 
}

exports.showTask = function showTask(args) { 
    var topmost = frameModule.topmost();  
    
    var navigationEntry = {
      moduleName : "views/tasks/task",
      context : {task : global.tasksVM.getItem(args.index)}
    };
      
    topmost.navigate(navigationEntry);    
}

exports.pageUnloaded = function pageUnloaded(args) {
    console.log("unload TASKS page"); 
    global.tasksVM.empty();
}


exports.fabTap = function(args) {
    global.tasksVM.add();
}



