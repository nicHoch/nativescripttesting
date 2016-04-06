var frameModule = require("ui/frame");
var config = require("~/shared/config");
 
var TaskType;
(function (TaskType) {
    TaskType.get = "get";
    TaskType.post = "post";
    TaskType.none = "none";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
 
var TaskStatus; 
(function (TaskStatus) {
    TaskStatus.waiting = 1;
    TaskStatus.send = 2;
    TaskStatus.responded = 3;
    TaskStatus.done = 4;
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));

exports.TaskDTO = function TaskDTO(name) {
    this.name       = name || "def";
    this.created    = new Date(); 
    this.lastTS     = this.created;    
    this.endpoint   = "";
    this.response   = {};
    this.data       = {};
    this.params     = {};
    this.priority   = 1;
    this.type       = TaskType.none;
    this.status     = TaskStatus.waiting;
    this.error      = [];
    this.callback   = "";
}; 

var TaskFactory;
(function (TaskFactory) {
    
    TaskFactory.getParams = function getParams() {
        return {key : config.apiKey}
    }
    
    TaskFactory.getApi = function getApi() {
        return config.apiUrl + "api/"; 
    }
    
    TaskFactory.getNode = function getNode(nodeID) {
        console.log("getNode: "+nodeID);
        var task = new Task.TaskDTO("GETNODE");
        task.endpoint = TaskFactory.getApi()+"node/id/"+nodeID;
        task.params = TaskFactory.getParams();
        task.params.show = "info,children";
        task.type = TaskType.get;   
        task.callback = "loadNodePage";
        
        
        task = global.theCragDB.tasks.insert(task);
        
        return task;
    }
    
    TaskFactory.logAscent = function logAscent(routeID, user) {
        console.log("getNode: "+routeID); 
        var task = new Task.TaskDTO("LOGASCENT");
        task.endpoint = TaskFactory.getApi()+"ascent/create/";
        task.params = TaskFactory.getParams();
        
        task.data.account = user.accountID;
        task.data.node = routeID;
        task.data.tick = "tick";
         
        task.type = TaskType.post;   
        task.callback = "afterAscentLog";
        
        
        task = global.theCragDB.tasks.insert(task);
        
        return task;
    }
    
    TaskFactory.afterAscentLog = function afterAscentLog(task) {
        console.log("afterAscentLog");
    }
    
    TaskFactory.loadNodePage = function loadNodePage(task) {
        console.log("loadNodePage");
        
        var node = task.response.data;
        var topmost = frameModule.topmost();  
         
        switch (node.type) {
            case "area":
  
                var navigationEntry = {
                    moduleName : "views/area/area",
                    context : {node : node, children : task.response.children}
                    
                };
                topmost.navigate(navigationEntry);   
                break;
            
            case "route":

                var navigationEntry = {
                    moduleName : "views/route/route",
                    context : {route : node}
                };
                topmost.navigate(navigationEntry);  
                break;
            default:
                alert("unsuported node type: "+data.type);
                break;
        }     
        
        
        
    }
    
    TaskFactory.dummy = function dummy() {
        console.log("dummy");
        var task = new Task.TaskDTO("DUMMY");
        task = global.theCragDB.tasks.insert(task);
        return task;
    }
     
})(TaskFactory = exports.TaskFactory || (exports.TaskFactory = {}));
    
  
//module.TaskFactory = TaskFactory;

