
// oWebViewInterface provides necessary APIs for communication to native app.
var oWebViewInterface = window.nsWebViewInterface;
var divtoposingle = document.getElementById('divtoposingle');
var divphototopo = document.getElementById('divphototopo');
var imgtopo = document.getElementById('imgtopo');
var divcanvas = document.getElementById('divcanvas');

function init(){
    oWebViewInterface.on('loadTopo', function(topo) {
        jQuery(divphototopo).removeData(); // remove topo internal data
        PhotoTopo.prototype.shared.topos = []; // clear page topo cache
        jQuery('.phototopo svg').remove(); // remove rendered topo svg

        divtoposingle.setAttribute("data-width",topo.width);
        divtoposingle.setAttribute("data-height",topo.height);

        divphototopo.setAttribute("data-tid",topo.width);
        divphototopo.setAttribute("data-view-scale",topo.viewscale);
        divphototopo.setAttribute("data-topodata",JSON.stringify(topo.topodata));
        divphototopo.setAttribute("data-width",topo.width);
        divphototopo.setAttribute("data-height",topo.height);
        divphototopo.setAttribute("style","max-width: "+topo.width+"px");

        divcanvas.setAttribute("style",topo.paddingbottom);

        imgtopo.setAttribute("src",topo.image);
        imgtopo.setAttribute("data-big",topo.image);

        jQuery(".phototopo").phototopo();
        jQuery('.phototopo svg').attr('viewBox',"0 0 100 200");
    });
}


init();


