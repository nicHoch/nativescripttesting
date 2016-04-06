//var fetchModule = require("fetch");
 	
var http = require("http");
var httpRequest = require("http/http-request");

var Task = require("~/shared/util/taskFactory");
var connectivity = require("connectivity");
var timer = require("timer");
var config = require("~/shared/config");

function TasksWorker() {
	this.clock = 1;
	this.deletedelay = 20 * 1000;
	
	
	 this.work = function() {
		this.clock++;	
		//console.log("WORK: " + this.clock);
		
		if ((this.clock % 1) == 0) {
			this.poll();
		}
		
		if ((this.clock % 10) == 0) {
			this.clean();
		}
		
		if ((this.clock % 10) == 0) {
			clock = 0;
		}
	 };
	 
	 this.print = function() {
		 console.log("PRINT: "+this.deletedelay);
	 }
	 
	 this.clean = function() {
		//console.log("CLEAN");
		var now = new Date().getTime();
		global.theCragDB.tasks.find({'status' : Task.TaskStatus.responded}).forEach(function(task) {  
			if ((now - task.lastTS) > this.deletedelay) {
				global.tasksVM.delete(task);
			}             
		},this); 
	 };
	 
	this.run = function(task) {
		console.log("Run Task: ");
		console.log(task.name + " > "+task.type);
		switch(task.type) {
			case "post" :
				console.log("POST");
                
                var call = {
                    url: task.endpoint,
                    method : "POST",
                    headers: {
                                "Content-Type": "application/json",
                                "X-CData-Key": "key="+config.apiKey         
                            }, 
                    content:  JSON.stringify({data : task.data}) 
                }
                   
                getJSON(call).then(function(result) {
                    
                    if (result.error != '') {
                        handleError(new Error(result.errorLabel),task);
                        return;
                    }
                    
                    task.lastTS = new Date().getTime();
					task.response = result; 
					task.status = Task.TaskStatus.responded;
					global.tasksVM.update(task);
                    
                    var cFn = global.Task.TaskFactory[task.callback];
                    if(typeof cFn === 'function') {
                        cFn(task);
                    }
                    
				}, function(error) {handleError(error,task)});
                
				break;

			case "get" :
				console.log("GET: "+task.endpoint + parameterToUrl(task.params));
					
				getJSON(task.endpoint + parameterToUrl(task.params)).then(function(result) {
                    task.lastTS = new Date().getTime();
					task.response = result;
					task.status = Task.TaskStatus.responded;
					global.tasksVM.update(task);
                    
                    var cFn = global.Task.TaskFactory[task.callback];
                    if(typeof cFn === 'function') {
                        cFn(task);
                    }
                    
				}, function(error) {handleError(error,task)});
					
				break;

			case "none" :
				console.log("NONE");
				break;
		}		
		
	}
	 
	 this.poll = function() {
		//console.log("POLL");
		
		if (!global.theCragDB || connectivity.getConnectionType() == connectivity.connectionType.none) {
			return;
		}
		
		var tasks = global.theCragDB.tasks.find({'status' : Task.TaskStatus.waiting});
		if (tasks.length > 0) {
			tasks.forEach(function(task) {
				task.status = Task.TaskStatus.send;
				global.tasksVM.update(task);
			});
			
			tasks.forEach(function(task) {
				this.run(task);
			},this);	
		}
	}
}

function getJSON(arg) {
    return new Promise(function (resolve, reject) {
        httpRequest.request(typeof arg === "string" ? { url: arg, method: "GET" } : arg)
            .then(function (r) {
            try {
                var json = r.content.toJSON();
                resolve(json);
            }
            catch (e) {
                reject({date : new Date(), error: e.message, code: responseCode, response: r.content.toString()});
            }
        }, function (e) { 
            return reject({date : new Date(), error: e.message, code: 0, response: ""}); 
        });
    });
}

function handleError(error, task) {
    task.lastTS = new Date().getTime();
    task.error.push({date : new Date(), error: error.message, code: 0, response: ""});
    task.status = Task.TaskStatus.waiting;
    global.tasksVM.update(task);
}

function parameterToUrl(params) {
    var str="";
    for(var key in params) {
        if (str != "") {
            str += "&";
        } else {
            str += "?"
        }
        str += key + "=" + encodeURIComponent(params[key])
    }
    return str;
}

var TW = new TasksWorker();

function runwork() {
	TW.work();
}

timer.setInterval(runwork, 1000);
 
module.exports = TW;