
    // oWebViewInterface provides necessary APIs for communication to native app.
    var oWebViewInterface = window.nsWebViewInterface;
    var mytext = document.getElementById('mytext');
    var tabcounter = 1;

    function init(){
        oWebViewInterface.on('loadText', function (newtext) {
            mytext.value = newtext;
        });
    }

    function sendTab(){
        oWebViewInterface.emit('sendTab',tabcounter++ % 2 ? "blue" : "red");
    }

    init();


