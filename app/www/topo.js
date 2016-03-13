
// oWebViewInterface provides necessary APIs for communication to native app.
var oWebViewInterface = window.nsWebViewInterface;
var divtoposingle = document.getElementById('divtoposingle');
var divphototopo = document.getElementById('divphototopo');
var imgtopo = document.getElementById('imgtopo');

function init(){
    oWebViewInterface.on('loadTopo', function(topo) {
        divtoposingle.setAttribute("data-width",topo.width);
        divtoposingle.setAttribute("data-height",topo.height);

        divphototopo.setAttribute("data-tid",topo.width);
        divphototopo.setAttribute("data-view-scale",topo.viewscale);
        divphototopo.setAttribute("data-topodata",topo.topodata);
        divphototopo.setAttribute("data-width",topo.width);
        divphototopo.setAttribute("data-height",topo.height);

        imgtopo.setAttribute("src",topo.image);
        imgtopo.setAttribute("data-big",topo.image);

        $(".phototopo").phototopo();
    });
}


init();


