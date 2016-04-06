var frameModule = require("ui/frame"); 

var task;
var page;

exports.pageLoaded = function pageLoaded(args) { 
    page = args.object;
    task = page.navigationContext.task;

    page.bindingContext = task;
}

exports.envokeCallBack = function envokeCallBack() {
     var cFn = global.Task.TaskFactory[task.callback];
                    if(typeof cFn === 'function') {
                        cFn(task);
                    }
}

exports.delTask = function delTask() {
    var dialogs = require("ui/dialogs");
    dialogs.confirm("Delete Task?").then(function (result) {
        if(result) {
            global.tasksVM.delete(pageData);
            frameModule.topmost().goBack();
        }
    });
    
}