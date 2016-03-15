var fetchModule = require("fetch");
var ObservableArray = require("data/observable-array").ObservableArray;
var Observable = require("data/observable").Observable;


function RouteListViewModel(data) {
    var viewModel = new Observable({
        routes: new ObservableArray(data.routes),
        itemSelected : new Observable(data.itemSelected)
    });
    return viewModel;
}

module.exports = RouteListViewModel;