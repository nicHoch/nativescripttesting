// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


function PhotoTopo(element, options) {
    this.$element = $(element);
    this.$img = this.$element.find('img');
    this.options = $.extend(true, {}, PhotoTopo.prototype.defaults, options, this.$element.data() );
    this.state = {};
    this.init();
}

PhotoTopo.prototype = {

    /*
     * constrains an object to within the topo dimensions and to a certain accuracy
     */
    constrain: function(obj){

        var o = this.options;
        var sc = o.viewScale;

        obj.x = Math.round(obj.x * 10) / 10;
        obj.y = Math.round(obj.y * 10) / 10;

        if (obj.x < 0) obj.x = 0;
        if (obj.y < 0) obj.y = 0;

        if (obj.x > o.width  / sc - 2) obj.x = o.width  / sc - 2;
        if (obj.y > o.height / sc - 2) obj.y = o.height / sc - 2;
    },

    /*
     * Parses the raw text format into a mutable model
     */
    parse: function parse(topoJSON){

        var topo = this;

        var model = {
            orig: topoJSON,
            routes: {},
            areas: {}
        };



        // Phase 0: First just parse the points data out into a mutable data structure
        model.orig.forEach(function text2model(el, i){

            var type = el.type;

            if (!type){
                type = "route";
            }

            // parse out the data for area shapes, but we don't want to generate a path yet
            // we'll tune the path to pixel boundaries and we can only do that later in the
            // context of a rendering environment
            if (type == "area"){
                var points = [];
                var parts;
                var pts = el.points.split(',');
                var raw = pts.shift();
                parts = raw.split(/\s/);
                var op = parts[2] || '';
                var label = {
                    valign:  op.charAt(1) || 'b', // 1: l=left    c=center  r=right
                    halign:  op.charAt(0) || 'l', // 2: t=top     m=middle  b=bottom
                    visible: op.charAt(2) || 'v', // 3: v=visible h=hidden
                    line:    op.charAt(3) || 'n', // 4: n=none    y=line    p=arrow
                    expand:  op.charAt(4) || 'a', // 5: d=expand  a=shrink  - expand to width of nearest horizontal edge
                    x:        parts[1] === undefined ? null : parts[0]*1,
                    y:        parts[1] === undefined ? null : parts[1]*1,
                    text:     decodeURIComponent (parts[3] || '{#} {name}')
                };
                topo.constrain(label);

                var p;
                while( p = pts.shift() ){
                    parts = p.split(/\s/);
                    var point = {
                        x: parts[0] * 1,
                        y: parts[1] * 1
                    };
                    topo.constrain(point);
                    points.push(point);
                }


                model.areas[el.id] = {
                    label: label,
                    points: points,
                    orig: el,
                    name: el.name || '',
                    num: el.num || ''
                };


            } else if (type == 'route'){

                var pointsA = el.points.split(/,/);
                var pointsM = [];
                if (pointsA[0] != ""){
                    pointsM = pointsA.map(function convertPoint2Object(p){
                        p = p.replace(/^\s+|\s+$/g, '');
                        var bits = p.split(/\s+/);
                        var type = bits[2] || '';
                        var visible = type.indexOf('hidden') == -1;
                        type = type.replace(/hidden/,'');
                        var point = {
                            x: bits[0]*1,
                            y: bits[1]*1,
                            type: type,
                            visible: visible
                        };
                        topo.constrain(point);
                        return point;
                    });
                }

                model.routes[el.id] = {
                    points: pointsM,
                    orig: el
                };
            } else {
                throw Exception('Unknown type');
            }

        });

        return model;
    },

    /*
     * Processes from a mutable model into a set of renderable paths
     */
    calculate: function calculate(model){

        var cache = {
            pointGroups: {},
            segments: {},
            routes: $.extend(true,{}, model.routes),
            areas:  $.extend(true,{}, model.areas )
        };

        var c = cache;

        // Phase 1: Process just route points into pointGroups
        model.orig.forEach(function model2pointGroup(el, i){

            var type = el.type;

            if (!type){
                type = "route";
            }
            if (type != "route"){
                return;
            }
            var pointsM = cache.routes[el.id].points;

            c.routes[el.id].segments = {};

            var pg = c.pointGroups;
            // for every point, add a path in and out, where possible for that point
            var lastKey;
            pointsM.forEach(function point2mergeGroup(el2,i,a){
                el2.id = el2.x+'_'+el2.y;
            });
     
            pointsM.forEach(function point2mergeGroup(el2,i,a){

                if (!pg[el2.id]) pg[el2.id] = {merge:{},x:el2.x,y:el2.y,routes:{},routeC:0};
                if(!pg[el2.id].routes[el.id]){
                    pg[el2.id].routes[el.id] = i+1; // Store not only that this route is through this point, but also which position
                    pg[el2.id].routeC++;
                }
                var prev = a[i==0 ? 0 : i-1];
                var next = a[i==a.length-1 ? a.length-1 : i+1];
                var key = prev.id+'_'+next.id;


                // this business is about building next and prev links
                c.routes[el.id].segments[key] = {};
                if (lastKey){
                    c.routes[el.id].segments[key].p = lastKey;
                    c.routes[el.id].segments[lastKey].n = key;
                }
                lastKey = key;


                if (!c.segments[key]){
                    var angle = 0;
                    if (next !== prev){
                        var x1 = prev.x;
                        var x2 = next.x;
                        var y1 = prev.y;
                        var y2 = next.y;
                        var dx = x2 - x1;
                        var dy = y2 - y1;
                        var angle = Math.atan2(dx,-dy);
                    }
                    //var angle = Math.round( rawAngle /  Math.PI * 180 );
                    //var len = Math.round( Math.sqrt( dx * dx + dy * dy ) );
                    c.segments[key] = {
                        routes: {},
                        angle: angle,
                        angleDeg: (angle / Math.PI * 180).toFixed(5)*1
                    };
                }

                c.segments[key].routes[el.id] = 1;


                var merge = {};
                if (i!=0)            merge.p = prev.id;
                if (i!=(a.length-1)) merge.n = next.id;
                pg[el2.id].merge[key] = merge;
            });

        });

        // Phase 2: Create merge groups from point groups
        // start at any mergeGroup, give it an id which is the same as it's own id
        // then see what other mergeGroups it is connected too. If it is connected then merge
        // the two groups by giving them both the id of the smallest id

        function findSharedGroups(pointId, mergeId, reversed, mergedWith){

            var pg = c.pointGroups[pointId];
            var m = pg.merge[mergeId];
            // if this segment is already inside a merge group then just exit (only happens when called at first round)
            if (m.inside){ return; }
            if (!mergedWith){
                mergedWith = mergeId;
            }
            m.inside = mergedWith;
            var segments = [{id:mergeId,reversed:reversed}];

            // now spread the merge to any other point groups that share the same next or prev point
            for (var key in pg.merge){
                var spread = pg.merge[key];
                if (!spread.inside && (
                     (m.n && m.n == spread.n) ||
                     (m.p && m.p == spread.p)
                    )){
                    segments = segments.concat( findSharedGroups(pointId, key, reversed, mergedWith) );
                }
                if (!spread.inside && (
                     (m.n && m.n == spread.p) ||
                     (m.p && m.p == spread.n)
                    )){
                    segments = segments.concat( findSharedGroups(pointId, key, !reversed, mergedWith) );
                }
            }

            //console.log(pointId);
            return segments;
        }

        for (var point in c.pointGroups){
            var pointGroup = c.pointGroups[point];
            for (var merge in pointGroup.merge){
                pointGroup.merge[merge].segments = findSharedGroups( point, merge, false );
            }
        };

        // Now just for convenience later, go through all points in all routes, and tell it which merge group it belongs to
        for (var rid in c.routes){
            var route = c.routes[rid];
            var points = route.points;
            for (var p=0; p < points.length; p++){
                var mergeGroups = cache.pointGroups[points[p].id].merge;
                var pn = p < points.length-1 ? p+1 : p;
                var pp = p == 0 ? p : p-1;
                var key = points[pp].id+'_'+points[pn].id;
                points[p].mergeid = mergeGroups[key].inside;
                points[p].dir = (p == 0) ? 1 : (p == points.length-1 ? -1 : 0);

                // If points double up, then mark them so these becomes 'sharp'
                if (p > 0 && points[p].x == points[p-1].x
                          && points[p].y == points[p-1].y){
                     mergeGroups[points[p].mergeid].doubled = 1;
                }
            }
        }

        // Phase 3: find the merge angle in degrees

        // returns degrees
        function findMergeAngle( merge ){

    //        console.log ('mergeAngle('+JSON.stringify(merge)+')');

            var angle = 0;
            var angC = 0;
            merge.segments.forEach(function getAngle( el, i, a){
                angC++;
    //            console.log (angC + ' = '+JSON.stringify(c.segments[el]) );
                angle += c.segments[el.id].angle
                       + (el.reversed ? Math.PI : 0);
            });
            angle = angle / angC;
    //        console.log ('tot = '+angle );

            return angle;
        }

        // This tunes how tight or loose each curve tracks the underlying polygon path
        // near 0 is polygonal, > 0.5 is very swishy
        var SHARPNESS = 0.27;

        for (var pointId in c.pointGroups){
            var pointGroup = c.pointGroups[pointId];
            for (var mergeId in pointGroup.merge){
                var merge = pointGroup.merge[mergeId];
                if (merge.segments){
                    var angle = findMergeAngle( merge );
                    merge.angle = angle;
                    merge.angleDeg = Math.round( merge.angle /  Math.PI * 180 );
                    //var len = Math.round( Math.sqrt( dx * dx + dy * dy ) );

                    var sharpness = merge.doubled ? 0 : SHARPNESS;

                    merge.dx = ( Math.sin(angle) * sharpness).toFixed(4)*1;
                    merge.dy = (-Math.cos(angle) * sharpness).toFixed(4)*1;

                    var coarseAngle = Math.round(merge.angleDeg/90) / 2 * Math.PI;
                    merge.cdx =  Math.sin(coarseAngle).toFixed(0)*1;
                    merge.cdy = -Math.cos(coarseAngle).toFixed(0)*1;

                    // now find the angle of each segment relative to this angle
                    merge.relAngle = {};
                    merge.order = {};
                    merge.segments.forEach(function(el,i,a){
                        merge.relAngle[el.id] = {
                            angle:    merge.angle    - c.segments[el.id].angle,
                            angleDeg: merge.angleDeg - c.segments[el.id].angleDeg
                        };
                        if (el.reversed){
                            merge.relAngle[el.id].angle    += Math.PI;
                            merge.relAngle[el.id].angleDeg += 180;
                        }
                    });

                    // ok now at this stage we may have segments that are re-use by different routes
                    // so lets make a hash of the real route
                    merge.routes = {};
                    merge.order = [];
                    merge.segments.forEach(function(el,i,a){
                        for (var route in c.segments[el.id].routes){
                            merge.routes[route] = el.id;
                            merge.order.push(route);
                            var dir = (el.reversed ? 2 : 3); // Update from simply 1, to which direction it should be going in
                            c.segments[el.id].routes[route] = dir;
                        }
                    });
                }
            }
        }

        var ret = {
            routes:      c.routes,
            areas:       c.areas,
            segments:    c.segments,
            pointGroups: c.pointGroups
        };

        return ret;
    },


    // These are variables that are shared across all topo instances via the prototype
    shared: {
        routeC: 0,
        topos: []
    },
    defaults: {
        viewScale: 1, // scale of max size of topo
        iconScale: 1, // wether icons are scaled down, eg in a big topo. viewScale is applied first
        zoomScale: 1, // this is user specified zoom
        zoomOrigX: 0, // The zoom origin
        zoomOrigY: 0, //
        editable: false,
        zindex: {
            hover: 101,
            select: 100
        }
    },

    init: function init() {

        var data = this.$element.data('topodata');
        if (!Array.isArray(data) ){
            try {
                data = JSON.parse(data);
            } catch (e){
                alert('Malformed JSON topo data');
                return;
            }
        }
        this.model = this.parse(data);
        this.cache = this.calculate(this.model);
        this.state = {};
        var topo = this;
        data.forEach(function storeData(el, i){
            el.order = i;
            topo.state[el.id] = el;
        });

        this.calcPaths();
        this.render();
    },

    /*
     * This calculates all the actual paths and path segments as they will be rendered in a particular
     * environment, given size, width etc
     */
    calcPaths: function calcPaths(){
        var c = this.cache;
        var sc = this.options.viewScale;

        for (var routeId in c.routes){
            var r = c.routes[routeId];
            r.path = '';
            var pathPartC = 0; // this tracks visible and hidden alternating parts
            r.pathParts = []; // this stores each hidden / visible part
            r.pathSegments = []; // this stores all bezier parts
            var ps = r.points;

            var start = r.points[0];

            if (!start) continue;

            r.path = '';
            var l = r.points.length-1;
            var p = 0; // prev (also is 0 for the first segment)
            var s = 0; // start
            var f = 1; // finish
            var n = 2; // next

            var m1,m2,mg1,mg2,c1,c2;
            for(; s<l; s++){

                // if at the end then truncate the last segment
                if (f>l) f = l;
                if (n>l) n = l;

                // find the id of the start and end point group
                m1 = ps[p].id + '_' + ps[f].id;
                m2 = ps[s].id + '_' + ps[n].id;
    //            console.log ('p='+p+' s='+s+' f='+f + ' n='+n);
    //            console.log ('s = '+s+' m1 = '+m1+' m2= '+m2 + '   p='+ps[p].id+"\n");

                // find what merge group each is part of and grab the control vector
                mg1 = c.pointGroups[ps[s].id].merge[m1].inside;
                mg2 = c.pointGroups[ps[f].id].merge[m2].inside;


                // find the control vector for that merge group
                c1 = c.pointGroups[ps[s].id].merge[mg1];
                c2 = c.pointGroups[ps[f].id].merge[mg2];

    //            console.log( "\nm1 = "+JSON.stringify(mg1,null,"   "));
    //            console.log( JSON.stringify(c1) );
    //            console.log( "\nm2 = "+JSON.stringify(mg2,null,"   "));
    //            console.log( JSON.stringify(c2) );

                // also if the route is going the other way the, then reverse the delta
                var mg1r = (c.segments[m1].routes[routeId] == 2 ) ? -1 : 1;
                var mg2r = (c.segments[m2].routes[routeId] == 2 ) ? -1 : 1;

                var sx = ps[s].x * sc;
                var sy = ps[s].y * sc;
                var fx = ps[f].x * sc;
                var fy = ps[f].y * sc;
    //            console.log ('s='+s+' sx='+sx+' sy='+sy+' f='+f+' fx='+fx + ' fy='+fy);

                var len = Math.sqrt( (sx-fx)*(sx-fx) + (sy-fy)*(sy-fy) );

                // multiple the length of the segment by each control vector to get the actual control point
                var c1x = (sx + c1.dx * len * mg1r);
                var c1y = (sy + c1.dy * len * mg1r);
                var c2x = (fx - c2.dx * len * mg2r);
                var c2y = (fy - c2.dy * len * mg2r);

    //            console.log ('c1x='+c1x+' c1y='+c1y+' c2x='+c2x+' c2y='+c2y);
    //            console.log( 'len = '+len+"\n\n\n" );

                var p = [
                    {x:sx ,y:sy },
                    {x:c1x,y:c1y},
                    {x:c2x,y:c2y},
                    {x:fx ,y:fy }
                ];

                var pathPart = '';
                var move = "M"+p[0].x.toFixed(1) + ' ' + p[0].y.toFixed(1);
                if (!r.path){
                    r.path = move;
                }
                var pathSegment = move;


                var visible = r.points[s].visible;

                if (r.pathParts[pathPartC] && r.pathParts[pathPartC].visible != visible ){
                    pathPartC++;
                }
                if (!r.pathParts[pathPartC]){
                    r.pathParts[pathPartC] = { svg: move, visible: visible };
                }


                // assemble
                pathPart += "C "+p[1].x.toFixed(1)+" "+p[1].y.toFixed(1)
                            +","+p[2].x.toFixed(1)+" "+p[2].y.toFixed(1)
                            +","+p[3].x.toFixed(1)+" "+p[3].y.toFixed(1);

                r.path += pathPart;
                pathSegment += pathPart;

                r.pathParts[pathPartC].svg += pathPart;
                r.pathSegments[s] = pathSegment;

                p = s;
                f = s+2;
                n = s+3;
            }
        }
    },


    /*
     * This is one of the trickiest event handlers that is very overloaded
     * Normal zoom:
     *  If you touch a topo off a route and move up or down it should let the page scroll
     *  If you touch and scrub left or right you should hover routes
     *  If you then let go on a route it will toggle it's selection
     *
     * Zoomed in:
     *  If you move then this pans the topo
     *  TODO If you just tap it autozooms back out
     *
     */
    scrubStart: function (e){

        if (!e.touches) return;

        this.touch = {
            state: 0,    // 0 = detecting, 1 = scrubbing, -1 = default scrolling, 2 = panning
            hover: null, // ID of the nid we are hovering
            ox: e.targetTouches[0].clientX,
            oy: e.targetTouches[0].clientY
        };

        checkHover(this, e );
        if (this.touch.hover){
            e.preventDefault();
            e.stopPropagation();
        }


        // detect if we are over a -nid
        function checkHover(topo, e){
            // var el = e.target;
            var el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            var nid = $(el).data('nid');
            if (nid != topo.touch.hover){
                // if then unhover
                if (topo.touch.hover){
                    topo.unhover(topo.touch.hover);
                    // TODO event?
                }
                if (nid){
                    topo.hover(nid);
                    // TODO event?
                }
                topo.touch.hover = nid;
            }
        }


        this.scrubMove = function(e){


            // Don't do anything until we know if we are scrolling or scrubbing
            if (this.touch.state == 0){

                var dx = e.targetTouches[0].clientX - this.touch.ox;
                var dy = e.targetTouches[0].clientY - this.touch.oy;
                var mdx = Math.abs(dx);
                var mdy = Math.abs(dy);

                if (mdx != 0 || mdy != 0){
                    this.touch.state = mdy >= mdx ? -1 : 1;
                }

            }
            if (this.touch.state == -1){
                // remove handlers
                this.scrubEnd(e, true);
            }
            if (this.touch.state != -1){
                checkHover(this, e );
                e.preventDefault();
            }

        }.bind(this);


        this.scrubEnd = function(e, fake){

            if (!fake){
                e.preventDefault();
            }
            if (this.touch.hover){
                var topo = this;
                var state = this.state[this.touch.hover];
                this.unhover(this.touch.hover);
                $(document).trigger('topotoggle', {
                    e: e,
                    node: state,
                    topo: topo,
                    orig: topo.cache[state.type+'s'][state.id].orig,
                    editing: topo.options.editable
                });
            }
            // is there a nid? then select is
            // also unhover it
            if (window.navigator.msPointerEnabled) {
                document.removeEventListener('MSPointerMove', this.scrubMove, true);
                document.removeEventListener('MSPointerUp',   this.scrubEnd,  true);
            } else {
                document.removeEventListener('touchmove',     this.scrubMove, true);
                document.removeEventListener('touchend',      this.scrubEnd,  true);
                document.removeEventListener('touchcancel',   this.scrubEnd,  true);
            }

        }.bind(this);


//        if(e.touches && e.touches.length > 0) {
//            return; // multi-touch - zoom? TODO cancel drag and zoom
//        }

        if (window.navigator.msPointerEnabled) {
            document.addEventListener('MSPointerMove', this.scrubMove, true);
            document.addEventListener('MSPointerUp',   this.scrubEnd,  true);
        } else {
            document.addEventListener('touchmove',     this.scrubMove, true);
            document.addEventListener('touchend',      this.scrubEnd,  true);
            document.addEventListener('touchcancel',   this.scrubEnd,  true);
        }

    },

    render: function render(refreshEvents) {
        // make this swap out just the changes stuff using a svg group <g>
        var cache = this.cache;
        var state = this.state;

        if (!this.$svg){
            var svg = '<svg class="topooverlay" width="100%" height="100%" viewBox="0 0 '+this.options.width+' '+this.options.height+'">';
            svg += '<g class="areas"></g>';
            svg += '<g class="render"></g>';
            svg += '<g class="events"></g>';
            svg += '</svg>';
            this.$svg = $(svg);
            this.$element.find('.canvas img').after(this.$svg);
            this.evtStart(this.$svg[0], this.scrubStart.bind(this) );
            var topo = this;
            this.$svg.click(function(e){
                // only handle these if the click was on the svg and not on something else
                // TODO should this be redundant with the scrub events?
                if (e.target.tagName == 'svg'){
                    topo.autoZoom(e);
                }
            });
            this.$element.hover(function(e){
                $(this).parent().find('.actionable').addClass('hover');
            }, function(e){
                $(this).parent().find('.actionable').removeClass('hover');
            });
        }

        if (this.$svg.find('.events').children().length == 0){
            refreshEvents = true;
        }

        function SVG(el, clazz){
            var e = document.createElementNS("http://www.w3.org/2000/svg", el);
            if (clazz) e.setAttribute('class', clazz);
            return e;
        }


        // Defined the svg def's
        // zindex:
        // 1: below shadow
        // 2: between shadow and route
        // 3: above route
        // 4: above all routes but under labels

        var pointTypes = {
            'endarrow': {
                svg: '<path id="endarrow" d="M0 -4 L-4 4 L0 3 L4 4 Z" />',
                zindex: 2
            },
            'crux': {
                svg: '<path id="crux" d="M2 -2.5 L5 -7.5 L0 -7.5 L-4 .5 L-1 .5 L-3 8 L5 -2.5 Z" fill="#ff0" stroke="black" stroke-width="1"/>',
                zindex: 4,
                angle: 'lock'
            },
            'warning': {
                svg: '<g id="warning">' +
                        '<path d="M0 -7 L7 7.5 L-7 7.5 Z" fill="#f90" stroke="black" stroke-width="1"  />'+
                        '<text x="0" y="5.8" text-anchor="middle" style="font-family: Tahoma, Arial; font-size: 11px; line-height: 16px; text-align: center; font-weight: bold;">!</text>'+
                     '</g>',
                zindex: 4,
                angle: 'lock'
            },
            'jumpoff': {
                svg: '<rect id="jumpoff" x="-5" y="-2" width="10" height="3" />',
                zindex: 2
            },
            // bolt == carrot bolt
            'bolt': {
                svg: '<path id="bolt" d="M-3.5 -2.5 L3.5 -2.5 L3.5 -.5 L1.5 -.5 L1.5 2.5 L-1.5 2.5 L-1.5 -.5 L-3.5 -.5 Z" />',
                zindex: 4,
                angle: 'lock'
            },
            'piton': {
                svg: '<path id="piton" d="M-2.5 -3.5 L1.5 -3.5 L2.5 -2.5 L2.5 -.5 L1.5 .5 L-0 .5  L-1 7  L-2.5 7 Z M-.5 -1.5 L1 -1.5" fill="#fff" stroke="#000" transform="rotate(90)" />',
                zindex: 4,
                angle: 'lock'
            },
            // draw == ring bolt, fixed hanger, u-bolt etc
            'draw': {
                svg: '<path id="draw" d="M-3.5 -3.5 l 1.5  0 l 2  2 l 2 -2 l 1.5  0 '+
                                                   'l 0  1.5 l-2  2 l 2  2 l 0  1.5 '+
                                                   'l-1.5  0 l-2 -2 l-2  2 l-1.5  0 '+
                                                   'l-0 -1.5 l 2 -2 l-2 -2 l 0 -1.5 Z" />',
                angle: 'lock',
                zindex: 4
            },
            'anchor': {
                svg: '<g id="anchor" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /></g>',
                zindex: 4,
                angle: 'lock'
            },
            'belay': {
                svg: '<g id="belay" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /></g>',
                zindex: 4,
                angle: 'lock'
            },
            'belaysemi': {
                svg: '<g id="belaysemi" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /><path d="M-5 0 L5 0" transform="rotate(45)"  /></g>',
                zindex: 4,
                angle: 'lock'
            },
            'belayhanging': {
                svg: '<g id="belayhanging" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /><path d="M0 5 L0 -5" /></g>',
                zindex: 4,
                angle: 'lock'
            },
            'lower': {
                svg: '<path id="lower" fill="#fff" stroke="#007" d="M-1.5 5 a5 5 0 1 1 3 0 l0 3 l3.5 -1.5 l-5 10 l-5 -10 l3.5 1.5 z" stroke-width="1.3"></path>',
                zindex: 4,
                angle: 'lock'
            },
            'thread': {
                svg: '<g id="thread" transform="scale(.9)">' +
                    '<path stroke="#000" fill="none" d="M-3 -5 C12,7 -12,7 3,-5" stroke-width="3.6" stroke-linecap="round"></path>' +
                    '<path stroke="#fff" fill="none" d="M-3 -5 C12,7 -12,7 3,-5" stroke-width="1.2" stroke-linecap="round"></path>' +
                '</g>',
                zindex: 4,
                angle: 'lock'
            }
        }


        var svg = '<svg>'; // we wrap svg tags in a <svg> so innerHTML knows to make it proper svg

        var phantom;
        if (refreshEvents){
            phantom = SVG('g', 'events');
        }
        function bindEvents(el, state, nid){
            var $el = $(el);
            $el.attr('data-nid', nid);
            $el.click    (function(e){
                $(document).trigger('topotoggle', {
                    e: e,
                    node: state,
                    topo: topo,
                    orig: topo.cache[state.type+'s'][state.id].orig,
                    editing: topo.options.editable
                });
            });
            $el.mouseover(function(e){
                $(document).trigger('topohover', {
                    el: e,
                    node: state,
                    topo: topo,
                    orig: topo.cache[state.type+'s'][state.id].orig
                });
            });
            $el.mouseout (function(e){
                $(document).trigger('topounhover', {
                    el: e,
                    node: state,
                    topo: topo,
                    orig: topo.cache[state.type+'s'][state.id].orig
                });
            });

            if (phantom){
                phantom.appendChild(el);
            }
        }

        var sc = this.options.viewScale;
        var is = this.options.iconScale;

        // Render area shapes. These go under routes, even if selected or hovered

        function tune(number, whole){
            number *= 1;
            number += .5;
            number = Math.round(number);
            if (!whole){
                number += .5;
            }
            return number;
        }


        function SVGText(label, $shadow, $line, state, bbox){
            var clazz = state['class'];
            var x = tune(label.x * sc,1);
            var y = tune(label.y * sc,1);
            var text = label.text;
            text = text.replace(/{#}/, state.num || '');
            text = text.replace(/{name}/, state.name);
            var width = label.w;

            var padding = 3;

            // sticks the text into the document
            // line by line
            // then gets to total box size
            // and moves the text to there
            // and finally returns the ref to the svg element
//            $labels.append(shadow);
            var lines = text.split(/\n/);
            var lineEl = [];
            var line;
            var lbb;
            var lineHeight = 0;
            var maxW = 0;
            var maxH = 0;


            // we don't know which is the widest line til we add it *sigh* so
            // just add them all and fix them up later in a second pass
            for(var c=0; c<lines.length; c++){
                line = SVG('text', clazz);
                lineEl[c] = line;
                line.textContent = lines[c];
                $line.append(line);
                lbb = line.getBBox();
                if (c==0){
                    lineHeight = lbb.height;
                }
                if (lbb.width > maxW){
                    maxW = lbb.width;
                }
                maxH += lbb.height;
                line.setAttribute("x", x);
                line.setAttribute("y", y + lbb.height * c);
            }
            maxW += 1; // fudge it for margin
            var halign = label.halign;
            var valign = label.valign;

            maxW = tune(maxW,true);
            maxH = tune(maxH,true);

            var stretch = 0; // if 1 then stretch to the right, if -1 then stretch to the left
            // Now check if we should expand out to the area width
            if (label.expand == "d"){
                var expand = 0;
                var points = area.points;
                // cycle through all points and see if one matches the label x/y
                // if so see if there are any horizontal edges in the same direction
                //
                function isExpand(cur, pos){

                    if (pos < 0){ pos = points.length; }
                    if (pos >= points.length){ pos = 0; }

                    var adj = points[pos];

                    // if the next, or prev point is on the same horizontal line
                    if (adj.y == cur.y){

                        var dx = adj.x - cur.x;
                        if ((dx > 0 && label) ||
                            (dx < 0 && label)){
                            var wid = Math.abs(tune(adj.x * sc) - tune(cur.x * sc)) - padding;
                            if (wid > maxW){
                                maxW = wid;
                                stretch = adj.x > cur.x ? 1 : -1; // does it stretch out to the left or right?
                            }
                            return;
                        }
                        // and is to the right, or left
                    }
                }
                for (var cc=0; cc < points.length; cc++){
                    var test = points[cc];
                    if (test.x == label.x && test.y == label.y){
                        isExpand(test,cc-1);
                        isExpand(test,cc+1);
                    }
                }
            }

            // Calculate how much we should offset the label by based on i's alignment
            var offY = (valign == 't' ? 1 : (valign == 'b' ? (maxH+1) : (tune(maxH / 2,true) + 1)));
            var offX = (halign == 'l' ? 0 : (halign == 'r' ? (maxW+3) : (tune(maxW / 2,true) + 2)));
            if (stretch == 1){
                offX = 0;
            }
            if (stretch == -1){
                offX = maxW + 3;
            }

            // The second pass, to fix alignment and correct for max width
            // Change the text align for each line fo text in the label
            for(var c=0; c<lines.length; c++){
                line = lineEl[c];
                lbb = line.getBBox();
                if (halign == 'r'){
                    line.setAttribute("x", x - lbb.width/2 + padding + maxW   - offX);
                } else if (halign == 'c'){
                    line.setAttribute("x", x               + padding + maxW/2 - offX);
                } else {
                    line.setAttribute("x", x + lbb.width/2 + padding          - offX);
                }
                line.setAttribute("y", y + lineHeight * (c+1) - offY);
            }


            var rect = SVG('rect', 'fg '+clazz);
            rect.setAttribute("x", x - offX);
            rect.setAttribute("y", y - offY + 1);
            rect.setAttribute("width", maxW + padding + 1);
            rect.setAttribute("height", maxH + 1);
            $shadow.append(rect);

            var shad = SVG('rect', 'bg '+clazz);
            shad.setAttribute("x", x - .5 - offX);
            shad.setAttribute("y", y - offY + .5);
            shad.setAttribute("width", maxW + padding + 2);
            shad.setAttribute("height", maxH + 2);
            $shadow.prepend(shad);

            // Draw the area arrow
            if (area.label.line != 'n'){

                var cx = tune((bbox[2] + bbox[0])/2)-1;
                var cy = tune((bbox[3] + bbox[1])/2)-1;


                var path= '';
                path += 'M '+tune(x-.5) +' '+tune(y-.5);
                path += 'L '+cx+' '+cy;
                var shadow = SVG('path', 'line areashadow '+st['class']);
                shadow.setAttribute('d',path);
                var aline = SVG('path', 'line area '+st['class']);
                aline.setAttribute('d',path);
                $s.prepend(shadow);
                $(aline).insertBefore(line)

                var ph = SVG('path', 'line area '+st['class']);
                ph.setAttribute('d',path);
                bindEvents(ph, st, aid);

                var dx = cx - x;
                var dy = cy - y;
                // svg: '<path id="endarrow" d="M0 -4 L-4 4 L0 3 L4 4 Z" />',
                if (area.label.line == 'p'){
                    // Draw arrow head
                    var deg = Math.atan2(-dx,dy) / Math.PI * 180;
                    var pointer = SVG('g');
                        pointer.setAttribute('transform', 'translate('+cx+','+cy+') rotate('+deg+')'+ (is == 1 ? '' : ' scale('+is+')') );
                    var head = SVG('path', 'head line area'+st['class']);
                        head.setAttribute('d', "M -3 -1 L 0 5 L 3 -1 L 0 0 z");
                    $(pointer).append(head).appendTo($l);
                    var pointer = SVG('g');
                        pointer.setAttribute('transform', 'translate('+cx+','+cy+') rotate('+deg+')'+ (is == 1 ? '' : ' scale('+is+')') );
                    var head = SVG('path', 'head line areashadow'+st['class']);
                        head.setAttribute('d', "M -3 -1 L 0 5 L 3 -1 L 0 0 z");
                    $(pointer).append(head).appendTo($s);
                }
            }


            var ph = SVG('rect','area label');
            ph.setAttribute("x", x - .5 - offX);
            ph.setAttribute("y", y - offY + .5);
            ph.setAttribute("width", maxW + padding + 2);
            ph.setAttribute("height", maxH + 2);
            return ph;
        }




        if (!!cache.areas){

            var $areas = this.$svg.find('.areas');
            $areas.empty();

            var maskPath = '';

            var s1 = SVG('g','normal');
            var l1 = SVG('g','normal');
            var s2 = SVG('g','selected');
            var l2 = SVG('g','selected');
            var s3 = SVG('g','hover');
            var l3 = SVG('g','hover');
            $areas.append(s1).append(l1);
            $areas.append(s2).append(l2);
            $areas.append(s3).append(l3);

            for (var aid in cache.areas){
                var area = cache.areas[aid];
                var points = area.points;
                var st = state[aid];
                if (area.label.x == null || area.label.x <= 0){
                    continue;
                }
                var path = '';
                var minx,maxx,miny,maxy;
                for(c=0; c<points.length; c++){
                    var p = points[c];
                    path += c == 0 ? 'M': 'L';
                    var px = tune(p.x*sc);
                    var py = tune(p.y*sc);
                    if (c==0){
                        minx=maxx=px;
                        miny=maxy=py;
                    } else {
                        miny = Math.min(miny, py);
                        minx = Math.min(minx, px);
                        maxy = Math.max(maxy, py);
                        maxx = Math.max(maxx, px);
                    }

                    path += px+' '+py;
                }
                path += "Z";
                if (!st['class']) st['class'] = '';
                var s = s1;
                var l = l1;
                if (this.hasClass(aid, 'selected') ){
                    maskPath += ' ' + path;
                }
                if ( this.hasClass(aid, 'hover') ){
                    s = s3;
                    l = l3;
                } else if (this.hasClass(aid, 'selected') ){
                    s = s2;
                    l = l2;
                }
                var $s = $(s);
                var $l = $(l);
                if (path != 'Z'){
                    var line = SVG('path', 'area ' + st['class'] + (area.label.visible == 'v' ? '' : 'hidden') );
                    line.setAttribute('d',path);
                    $l.append(line);
                    var shadow = SVG('path', 'areashadow '+st['class'] + (area.label.visible == 'v' ? '' : 'hidden') );
                    shadow.setAttribute('d',path);
                    $s.prepend(shadow);
                }

                var text = SVGText(area.label, $s, $l, st, [minx,miny,maxx,maxy]);
                if (refreshEvents){
                    var pr = SVG('path', 'area shape');
                    if (path != 'Z'){
                        pr.setAttribute("d", path);
                    }
                    bindEvents(pr, st, aid);
                    bindEvents(text, st, aid);
                }
            }

        }

        // If there are any masks then render
        // TODO bug if area path is anti-clockwise instead of clockwise
        // http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
        /*
        if (!this.options.mask && maskPath){
            var w = this.options.width;
            var h = this.options.height;
            var maskPath = 'M0 0 L '+w+' 0 L '+w+' '+h+' L 0 '+h+' ' + maskPath;
            var mask = SVG('path', 'mask');
            mask.setAttribute("d", maskPath);
            $areas.prepend(mask);
        }
        */


        var routes = [];
        for (var route in cache.routes){
            routes.push(route);
        }
        routes.sort(function(a,b){
            var ar = state[a];
            var br = state[b];
            var az = (ar && ar.zindex) ? ar.zindex : 0;
            var bz = (br && br.zindex) ? br.zindex : 0;
            return az - bz;
        });

        var zindex4 = '';


        svg += '<g class="routes">';
        for (var c = 0; c < routes.length; c++){
            var r = cache.routes[routes[c]];
            var st = this.state[routes[c]];

            // pre process points
            // if no label add label to point 0, or first point with no type
            // if no last point type then make it an endarrow


            var layers = {};
            function showPoints(){

                // cycle through all point on a route, if the zindex matches show the point
                var points = r.points;
                var foundLabel = false;
                for (var p = 0; p < points.length; p++){
                    var point = points[p];
                    var type = point.type;

                    if (type == 'label'){
                        foundLabel = true;
                    }
                    if (p == points.length-1 && !type){
                        type = 'endarrow';
                    }
                    if (type && pointTypes[type]){
                        var ax = point.x;
                        var ay = point.y;
                        var axy = ax + '_' + ay;
                        var m = cache.pointGroups[axy].merge;

                        var deg = 0;
                        if ('lock' != pointTypes[type].angle){
                            var mkey = point.mergeid;
                            deg = m[mkey].angleDeg ? m[mkey].angleDeg : m[m[mkey].inside].angleDeg;
                        }
                        pointTypes[type].used = 1;
                        var zindex = pointTypes[type].zindex;
                        if (!layers[zindex]) layers[zindex] = '';
                        layers[zindex] += '<g class="'+ type+'" transform="translate('+tune(ax*sc-.5,1)+','+tune(ay*sc-.5,1)+') rotate('+deg+')'
                            + (is == 1 ? '' : ' scale('+is+')')
                            + '"><use xlink:href="#'+type+'" /></g>';
                    }
                }
                if (!foundLabel && r.points[0]){
                    r.points[0].type = 'label';
                }

            }

            showPoints();

            svg += '<g class="'+(st['class'] ? st['class'] : '')+'">';

            // Draw the shadows behind the routes
            for (var rp = 0; rp < r.pathParts.length; rp++){
                var part = r.pathParts[rp];
                svg += '<path class="routeshadow '+(part.visible?'':'hidden ')+'" d="'+part.svg+'" />';
            }

            if (layers[2]){
                svg += layers[2];
            }

            // This is the main route curve(s) (multiple if some parts are hidden)
            for (var rp = 0; rp < r.pathParts.length; rp++){
                var part = r.pathParts[rp];
                svg += '<path class="route '+(part.visible?'':'hidden ')+'" d="'+part.svg+'" />';
            }
            if (refreshEvents && r.path){
                var pr = SVG('path');
                pr.setAttribute("d", r.path);
                bindEvents(pr, st, routes[c]);
            }

            if (layers[3]){
                svg += layers[3];
            }
            svg += '</g>';
            if (layers[4]){
                zindex4 += layers[4];
            }

        }
        svg += '</g>';

        svg += '<g class="zindex4">';
        svg += zindex4;
        svg += '</g>';

        svg += '<g class="labels">';
        // Labels are special
        // first find all of them
        // calc each ones direction and width (width can be variable now!)
        // then group by anchor point
        var labelsByPoint = {};
        for (var c = 0; c < routes.length; c++){
            var r = cache.routes[routes[c]];
            var st = this.state[routes[c]];
            // If the route doesn't have a label then don't draw one!
            if (!st.num) continue;
            var points = r.points;
            for (var p = 0; p < points.length; p++){
                var point = points[p];
                var mergeGroup = cache.pointGroups[point.id].merge[point.mergeid];
                if (point.type == 'label'){ 
                    var label = {
                        x: point.x,
                        y: point.y,
                        rid: routes[c],
                        order: st.order,
                        num: st.num,
                        cssClass: st['class'],
                        width: 16,
                        dx: mergeGroup.cdx, // round the direction to up down left right, what is the x/y
                        dy: mergeGroup.cdy, // components of this simplified vector?
                        dir: point.dir      // 1 for start of line, 0 for inline, -1 for end of line 
                    };
                    var key = point.id;
                    if (!labelsByPoint[key]){
                        labelsByPoint[key] = [];
                    }
                    labelsByPoint[key].push(label);
                }
            }
        }

        var half = 5;
        var topo = this;
        $.each(labelsByPoint, function(i, group){
            var gx = Math.round(group[0].x * sc);
            var gy = Math.round(group[0].y * sc);
            group.sort(function(a,b){
                return a.order - b.order;
            });
            for(var p=0; p<group.length; p++){
                var point = group[p];

                // find center anchor
                var x = gx - .5 - half;
                var y = gy - .5 - half;

                // what is the 'forward' vector for this point?
                var dx = point.dx;
                var dy = point.dy;

                // now offset if at the start or end of a line based on direction
                x -= dx * half * point.dir * 1;
                y -= dy * half * point.dir * 1;

                // now offset based on how many in the group
                x -= -dy * ((group.length-1) * (half+1));
                y -=  dx * ((group.length-1) * (half+1));

                // now offset based on which one we are
                x += -dy * p * (half * 2 + 2);
                y +=  dx * p * (half * 2 + 2);

                // now fix if near edge of topo
                // dirty hack, fix better later 12 = width 22 / 2 + 1
                if (y > topo.options.height - 12){
                    y = topo.options.height - 12;
                }


                // Margins
                var M = 5;
                var margint = 0;
                var marginr = 0;
                var marginb = 0;
                var marginl = 0;
               if (dx == 0){
                    margint = M;
                    marginb = M;
                } else {
                    marginl = M;
                    marginr = M;
                }
                if (p == 0){
                    if (dy < 0){ marginl = M; }
                    if (dy > 0){ marginr = M; }
                    if (dx < 0){ marginb = M; }
                    if (dx > 0){ margint = M; }
                }
                if (p == group.length-1){
                    if (dy < 0){ marginr = M; }
                    if (dy > 0){ marginl = M; }
                    if (dx < 0){ margint = M; }
                    if (dx > 0){ marginb = M; }
                }

                svg += '<g class="label '+point.cssClass+'">';
                svg += '<rect x="'+x+'" y="'+y+'" width="'+(half*2+2)+'" height="'+(half*2+2)+'" stroke="#000" fill="#fff" rx="1" ry="1" />';
                svg += '<text x="'+(x+half+1)+'" y="'+(y+half+3.5)+'" text-anchor="middle" style="font-family: Tahoma, Arial; font-size: 8px; line-height: 16px; text-align: center;">'+point.num+'</text>';
                svg += '</g>';
                if (refreshEvents){
                    var pr = SVG('rect','routelabel');
                    pr.setAttribute("x", x - marginl);
                    pr.setAttribute("y", y - margint);
                    pr.setAttribute("width",  half * 2 + 2 + marginl + marginr);
                    pr.setAttribute("height", half * 2 + 2 + margint + marginb);
                    bindEvents(pr, topo.state[point.rid], point.rid);
                }
            }
        });
        svg += '</g>';
        // if more than one direction choose the most common, default to bottom
        // labels in the middle of a line have no direction, ie a centered
        // if a group would hit any edge nudge the whole group over
        // each group may have rounded corners
        // now draw them all





        // Only spit out def's for points we actually use
        svg += '<defs>';
        for (var type in pointTypes){
            if (pointTypes[type].used){
                svg += pointTypes[type].svg;
            }
        }
        svg += '<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" x="0" y="0" width="10" height="10">'+
                "<line x1='-5' y1='0'  x2='10' y2='15' stroke='#08c' stroke-width='3' stroke-opacity='70%' />"+
                "<line x1='0'  y1='-5' x2='15' y2='10' stroke='#08c' stroke-width='3' stroke-opacity='70%' />"+
                '</pattern>';
        svg += '</defs>';
        svg += '</g>';
        svg += '</svg>';


        // Everything up to here gets redraw for any reason
        // Stuff below here gets mutated, but may get redraw if really needed TODO

        this.$svg.find('.render').empty().append( $(svg).children() );

        // now render the stuff purely for mouse and touch handlers floating above the rest
        if (refreshEvents){
            this.$svg.find('.events').empty().append( $(phantom).children() );
        }

    },


    addPointToRoute: function addPointToRoute(routeId, x, y, type, index) {
        // some logic
    },

    updatePointOnRoute: function (routeId, x, y, type, index) {
        // some logic
    },

    removePointFromRoute: function (routeId, index) {
        // some logic
    },


    hasClass: function hasClass(nodeId, clazz) {
        var st = this.state[nodeId];
        if (!st || !st['class']){
            return false;
        }
        return (" "+st['class']+" ").indexOf(' '+clazz+' ') != -1;
    },

    addClass: function addClass(nodeId, clazz) {
        var st = this.state[nodeId];
        if (!st){
            return false;
        }
        if (!st['class']){
            st['class'] = ' ';
        }
        st['class'] += ' ' + clazz + ' ';
        return true;
    },

    removeClass: function removeClass(nodeId, clazz) {

        var st = this.state[nodeId];
        if (!st || !st['class']){
            return;
        }
        st['class'] = (' '+st['class']+' ').replace(' '+clazz+' ',' ','g').replace(/\s+/g,' ');
        return true;
    },
    overrideZindex: function overrideZindex(nodeId, zindex) {
        var st = this.state[nodeId];
        if (!st){
            return false;
        }
        if (!st.origzindex){
            st.origzindex = st.zindex;
        }
        st.zindex = zindex;
        return true;
    },
    restoreZindex: function restoreZindex(nodeId) {
        var st = this.state[nodeId];
        if (!st || !st.origzindex){
            return false;
        }
        st.zindex = st.origzindex;
        return true;
    },

    hover: function hover(nodeId) {
        if(this.hasClass(nodeId, 'hover')) return;
        this.addClass(nodeId, 'hover');
        this.$element.addClass('cursor-pointer')
        this.overrideZindex(nodeId, this.defaults.zindex.hover);
        this.render();
    },
    unhover: function unhover(nodeId) {
        this.$element.removeClass('cursor-pointer')
        if(!this.hasClass(nodeId, 'hover')) return;
        this.removeClass(nodeId, 'hover');
        this.restoreZindex(nodeId);
        this.render();
    },
    select: function select(nodeId) {

        var selected = !!nodeId.pop ? nodeId : [nodeId];
        for(var c=0; c<selected.length; c++){
            var nid = selected[c];
            this.addClass(nid, 'selected');
            this.overrideZindex(nid, this.defaults.zindex.select);
        }
        this.render();
    },
    deselect: function deselect(nodeId) {
        if(!this.removeClass(nodeId, 'selected')) return;
        this.restoreZindex(nodeId);
        this.render();
    },
    toggle: function toggle(nodeId) {
        if (!this.state[nodeId]) return;
        if (this.hasClass(nodeId, 'selected')){
            this.deselect(nodeId);
        } else {
            this.select(nodeId);
        }
    },
    selected: function(){
        var selected = [];
        var that = this;
        $.each( this.state, function(key, val){
            if (that.hasClass(key, 'selected')) selected.push(key);
        });
        return selected;
    },
    deselectAll: function deselect(nodeId) {
        var that = this;
        $.each( this.state, function(nodeId, val){
            that.removeClass(nodeId, 'selected');
            that.restoreZindex(nodeId);
        });
        this.render();
    },
    hide: function hide() {
        this.$svg.hide();
    },
    show: function show() {
        this.$svg.show();
    },
    evtStart: function (el, func){
        if (window.navigator.msPointerEnabled) {
            el.addEventListener('MSPointerDown', func, true);
        } else {
            el.addEventListener('touchstart',    func, true);
            el.addEventListener('mousedown',     func, true);
        }
    },
    /*
     * An absolute zoom, mostly used internally
     * x/y are in topo coordinates
     */
    zoomTo: function (x,y, scale, animate){
        var sc = this.options.viewScale;
        this.zoomScale = scale;

        var $can = this.$element.find('.canvas');
        if (scale == 1){
            this.zoomOrigX = 0;
            this.zoomOrigY = 0;
        } else {
            this.zoomOrigX = 100 * x / this.options.width  * sc;
            this.zoomOrigY = 100 * y / this.options.height * sc;
        }
        $can.removeClass('animate');
        if (scale != 1){
            $can.css({
            '-webkit-transform-origin': this.zoomOrigX+'% '+this.zoomOrigY+'%',
                '-ms-transform-origin': this.zoomOrigX+'% '+this.zoomOrigY+'%',
                    'transform-origin': this.zoomOrigX+'% '+this.zoomOrigY+'%',
                'z-index': 2012
            });
        }
        $can.css('-webkit-transform-origin');
        $can.css(    '-ms-transform-origin');
        $can.css(        'transform-origin');

        $can.toggleClass('zoomed', scale != 1);
        $can.toggleClass('animate', animate);
        $can.css({
            '-webkit-transform': 'scale('+scale+')',
                '-ms-transform': 'scale('+scale+')',
                    'transform': 'scale('+scale+')'
        })

        if (scale == 1){
            $can.css({
                'z-index': 'auto'
            });
        }
        // Now do a bigger image check
        $can.find('img[data-big]').each(function(){
            $(this).attr({src: $(this).data('big'),'data-big':null})
        });

    },

    /*
     * This is single click zoom in /out handler
     * TODO make touch handler integrated with scrub / hover / select
     */
    autoZoom: function(e){
        if (this.editmode && this.editmode != 'select'){
            // Should never get here anyway as the event layer overlaps the background
            return;
        }
        var pos = this.getEventPos(e);
        var scale = (!this.zoomScale || this.zoomScale == 1) ? 2 : 1;
        var margin = 20;
        var opts = this.options;
        var $w = $(window);
        var $el = this.$element;
        var wh = $w.height() - margin * 2;
        var ww = $w.width() - margin * 2;
        // If zooming in, and the height of the topo, when zoomed, is smaller than the height of the viewport
        if (scale != 1){
            if (wh > scale * $el.height() &&
                ww > scale * $el.width()  ){

                // then zoom the topo even more so it fills the screen better
                scale = wh / $el.height();

                // but not too much that wide topos get cropped
                if (scale > ww / $el.width()){
                    scale = ww / $el.width();
                }
                // but make sure we're still at least 2x
                if (scale < 2){
                    scale = 2;
                }

                // and center it vertically
                pos.y = $el.offset().top - $w.scrollTop() - margin;
                pos.y /= (wh - $el.height());
                pos.y *= $el.height();
                pos.y /= opts.viewScale;

                // center horizontally
                pos.x = ww * .5 - $el.offset().left - $el.width() * .5 * scale - margin;
                pos.x /= (1 - scale);
            }
        }

        this.zoomTo(pos.x,pos.y,scale,true);
    },


    /*
     * Given an event, touch, mouse etc, return the coordinates in the topo
     */
    getEventPos: function(e){

        var x, y;
        var opt = this.options;
        var $el = this.$element;

        if(e.targetTouches) {
            // Touch Events
            x = e.targetTouches[0].clientX;
            y = e.targetTouches[0].clientY;
        } else {
            // Either Mouse event or Pointer Event
            x = e.clientX;
            y = e.clientY;
        }

        // Account for where topo is on screen
        var topoPos = $el.offset();
        x -= topoPos.left;
        y -= topoPos.top;

        var $w = $(window);
        x += $w.scrollLeft();
        y += $w.scrollTop();

        // Account for topo scale
        var sc = opt.viewScale;
        x /= sc;
        y /= sc;

        // Account for responsive topo
        x /= $el.width()  / opt.width;
        y /= $el.height() / opt.height;

        // Accounts for zoom scale and pan
        if (this.zoomScale){

            x += this.zoomOrigX * $el.width()  * .01 * (this.zoomScale - 1) / sc;
            y += this.zoomOrigY * $el.height() * .01 * (this.zoomScale - 1) / sc;

            x /= this.zoomScale;
            y /= this.zoomScale;
        }

        return { x:x, y:y }
    }
};

// Static convenience methods
// Convert to a names whitelist which converts static to instance methods

PhotoTopo.hover    = function hover   (opt){ var ts = PhotoTopo.prototype.shared.topos; $.each(ts, function(i, e){ e.hover   (opt); }); };
PhotoTopo.unhover  = function unhover (opt){ var ts = PhotoTopo.prototype.shared.topos; $.each(ts, function(i, e){ e.unhover (opt); }); };
PhotoTopo.select   = function select  (opt){ var ts = PhotoTopo.prototype.shared.topos; $.each(ts, function(i, e){ e.select  (opt); }); };
PhotoTopo.deselect = function deselect(opt){ var ts = PhotoTopo.prototype.shared.topos; $.each(ts, function(i, e){ e.deselect(opt); }); };
PhotoTopo.toggle   = function toggle  (opt){ var ts = PhotoTopo.prototype.shared.topos; $.each(ts, function(i, e){ e.toggle  (opt); }); };

(function ($, window, document, undefined) {

    $.fn.phototopo = function(options, args) {
        if (options === "hover"   ){ return PhotoTopo.hover   (args); }
        if (options === "unhover" ){ return PhotoTopo.unhover (args); }
        if (options === "select"  ){ return PhotoTopo.select  (args); }
        if (options === "deselect"){ return PhotoTopo.deselect(args); }
        if (options === "toggle"  ){ return PhotoTopo.toggle  (args); }

        var topo = this.data('phototopo');
        if (topo){
            if (options === "hide" ){ return topo.hide (args); }
            if (options === "show" ){ return topo.show (args); }
            if (options === "edit" ){ return topo.edit (args); }
            if (options === "view" ){ return topo.view (args); }
        }

        return this.each(function initTopo() {
            if (!$.data(this, "phototopo")) {
                var PT = new PhotoTopo(this, options);
                PhotoTopo.prototype.shared.topos.push(PT);
                $.data(this, "phototopo", PT);
            }
        });
    };

    // Auto inflate topos as soon as this code is loaded
    $('.phototopo').phototopo();

    $(document).trigger('toposready');

})(jQuery, window, document);


