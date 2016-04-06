var fetchModule = require("fetch");
var ObservableArray = require("data/observable-array").ObservableArray;
var Observable = require("data/observable").Observable;


function indexOf(item) {
    var match = -1;
    this.forEach(function(loopItem, index) {
        if (loopItem.id === item.id) {
            match = index;
        }
    });
    return match;
}

function RouteListViewModel(routes) {
    var viewModel = new ObservableArray(routes);
    return viewModel;
}

module.exports = RouteListViewModel;