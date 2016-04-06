  var waitTime = 3000;
  var cleanCycle = 10;
  var cycle = 0;
  var taskcounter = 0;
  
  onmessage = function(todo) {
    
    switch (todo.aktion) {
        case 'nothing' :
            console.log("WORKER: nothing toDo");
            break;
        case 'runtasks' :
            console.log("WORKER: runtasks");
            todo.tasks.forEach(function(task) { runTask(task); });  
            break;
    }
    setTimeout("askForAction()",waitTime);     
  };

function runTask(task) {
   console.log("Run Task: ");
   taskcounter++;
   console.log(task.name + " > "+task.type);
   switch(task.type) {
        case "post" :
            console.log("POST");
            break;
   
        case "get" :
            console.log("GET");
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = taskResponse(xhttp, task);
            console.log("GET: "+ task.endpoint + parameterToUrl(task.params));
            xhttp.open("GET", task.endpoint + parameterToUrl(task.params),true);
            xhttp.setRequestHeader('Access-Control-Allow-Origin','*');
            xhttp.send(null);
            break;

        case "none" :
            console.log("NONE");
            break;
   }
}

function taskResponse(xhttp, task) {
                console.log("onreadystatechange: " + xhttp.readyState);
                 console.log(xhttp.statusText);
                if(xhttp.readyState == 4) {
                    var date = new Date().getTime();
                    task.lastTS = date;
                    
                    if (xhttp.status == 200) {
                        task.response = JSON.parse(xhttp.responseText);
                        task.status = 3;
                    } else {
                       task.error[date] = xhttp.status +": "+xhttp.statusText;
                       task.status = 1;
                    }
                    returnTasks([task]);
                } 
            }; 
  
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

function returnTasks(tasks) {
    var message = { type : "done", tasks : tasks}
    postMessage(message);
}
 
function askForAction() {
    cycle++;
    var message = { type : "ask"}
    
    if (cycle==cleanCycle) {
        message = { type : "clean"}
        cycle = 0;
    }
    
    postMessage(message);
}
  
onready = function() {
    askForAction();
};