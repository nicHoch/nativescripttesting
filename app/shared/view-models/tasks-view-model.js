var fetchModule = require("fetch");
var ObservableArray = require("data/observable-array").ObservableArray;
var Observable = require("data/observable").Observable;
var Task = require("~/shared/util/taskFactory");
var connectivity = require("connectivity");

function TasksViewModel() {
    var viewModel = new ObservableArray([]);
     
    viewModel.myIndexOf = function myIndexOf(item) {
        var match = -1;
        this.forEach(function(loopItem, index) {
            if (loopItem.$loki === item.$loki) {
                match = index;
            }
        });
        return match;
    }
    
    viewModel.load = function() {
        global.theCragDB.tasks.find().forEach(function(task) {
            viewModel.push(task);  
        });
    }
    
    viewModel.update = function(task) {
        global.theCragDB.tasks.update(task);
        var idx = viewModel.myIndexOf(task);
        if(idx >= 0) viewModel.setItem(idx,task);
    }
    
    viewModel.delete = function(task) {
        global.theCragDB.tasks.remove(task);
        var idx = viewModel.myIndexOf(task);
        if(idx >= 0) viewModel.splice(idx, 1);
    }

    viewModel.empty = function() {
        while (viewModel.length) {
            viewModel.pop();
        }
    }
        
    viewModel.add = function(id) {
        id = id || 190488567;
        var task = global.Task.TaskFactory.getNode(id);
        viewModel.push(task);
    }
    
    viewModel.logAscent = function(routeID, user) {
        var task = global.Task.TaskFactory.logAscent(routeID, user);
        viewModel.push(task);
    }
     
    viewModel.updateTasks = function(tasks)  {
        tasks.forEach(function(element) {
           
            global.tasksVM.update(element);
        }, this); 
    }
    
    
     
    return viewModel;
}

module.exports = TasksViewModel;