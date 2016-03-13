if (!Function.prototype.bind)Function.prototype.bind = function (a) {
    if (typeof this !== "function")throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    var b = Array.prototype.slice.call(arguments, 1), d = this, e = function () {
    }, c = function () {
        return d.apply(this instanceof e && a ? this : a, b.concat(Array.prototype.slice.call(arguments)))
    };
    e.prototype = this.prototype;
    c.prototype = new e;
    return c
};
function PhotoTopo(a, b) {
    this.$element = $(a);
    this.$img = this.$element.find("img");
    this.options = $.extend(true, {}, PhotoTopo.prototype.defaults, b, this.$element.data());
    this.state = {};
    this.init()
}
PhotoTopo.prototype = {
    constrain: function (a) {
        var b = this.options, d = b.viewScale;
        a.x = Math.round(a.x * 10) / 10;
        a.y = Math.round(a.y * 10) / 10;
        if (a.x < 0)a.x = 0;
        if (a.y < 0)a.y = 0;
        if (a.x > b.width / d - 2)a.x = b.width / d - 2;
        if (a.y > b.height / d - 2)a.y = b.height / d - 2
    },
    parse: function (a) {
        var b = this, d = {orig: a, routes: {}, areas: {}};
        d.orig.forEach(function (e) {
            var c = e.type;
            c || (c = "route");
            if (c == "area") {
                c = [];
                var f, i = e.points.split(",");
                f = i.shift().split(/\s/);
                var g = f[2] || "";
                g = {
                    valign: g.charAt(1) || "b",
                    halign: g.charAt(0) || "l",
                    visible: g.charAt(2) ||
                    "v",
                    line: g.charAt(3) || "n",
                    expand: g.charAt(4) || "a",
                    x: f[1] === undefined ? null : f[0] * 1,
                    y: f[1] === undefined ? null : f[1] * 1,
                    text: decodeURIComponent(f[3] || "{#} {name}")
                };
                for (b.constrain(g); f = i.shift();) {
                    f = f.split(/\s/);
                    f = {x: f[0] * 1, y: f[1] * 1};
                    b.constrain(f);
                    c.push(f)
                }
                d.areas[e.id] = {label: g, points: c, orig: e, name: e.name || "", num: e.num || ""}
            } else if (c == "route") {
                c = e.points.split(/,/);
                i = [];
                if (c[0] != "")i = c.map(function (m) {
                    m = m.replace(/^\s+|\s+$/g, "");
                    m = m.split(/\s+/);
                    var s = m[2] || "", A = s.indexOf("hidden") == -1;
                    s = s.replace(/hidden/,
                        "");
                    m = {x: m[0] * 1, y: m[1] * 1, type: s, visible: A};
                    b.constrain(m);
                    return m
                });
                d.routes[e.id] = {points: i, orig: e}
            } else throw Exception("Unknown type");
        });
        return d
    },
    calculate: function (a) {
        function b(j, l, h, v) {
            var k = c.pointGroups[j], o = k.merge[l];
            if (!o.inside) {
                v || (v = l);
                o.inside = v;
                l = [{id: l, reversed: h}];
                for (var J in k.merge) {
                    var H = k.merge[J];
                    if (!H.inside && (o.n && o.n == H.n || o.p && o.p == H.p))l = l.concat(b(j, J, h, v));
                    if (!H.inside && (o.n && o.n == H.p || o.p && o.p == H.n))l = l.concat(b(j, J, !h, v))
                }
                return l
            }
        }

        function d(j) {
            var l = 0, h = 0;
            j.segments.forEach(function (v) {
                h++;
                l += c.segments[v.id].angle + (v.reversed ? Math.PI : 0)
            });
            l /= h;
            return l
        }

        var e = {
            pointGroups: {},
            segments: {},
            routes: $.extend(true, {}, a.routes),
            areas: $.extend(true, {}, a.areas)
        }, c = e;
        a.orig.forEach(function (j) {
            var l = j.type;
            l || (l = "route");
            if (l == "route") {
                l = e.routes[j.id].points;
                c.routes[j.id].segments = {};
                var h = c.pointGroups, v;
                l.forEach(function (k) {
                    k.id = k.x + "_" + k.y
                });
                l.forEach(function (k, o, J) {
                    h[k.id] || (h[k.id] = {merge: {}, x: k.x, y: k.y, routes: {}, routeC: 0});
                    if (!h[k.id].routes[j.id]) {
                        h[k.id].routes[j.id] = o + 1;
                        h[k.id].routeC++
                    }
                    var H =
                        J[o == 0 ? 0 : o - 1], S = J[o == J.length - 1 ? J.length - 1 : o + 1], K = H.id + "_" + S.id;
                    c.routes[j.id].segments[K] = {};
                    if (v) {
                        c.routes[j.id].segments[K].p = v;
                        c.routes[j.id].segments[v].n = K
                    }
                    v = K;
                    if (!c.segments[K]) {
                        var G = 0;
                        if (S !== H)G = Math.atan2(S.x - H.x, -(S.y - H.y));
                        c.segments[K] = {routes: {}, angle: G, angleDeg: (G / Math.PI * 180).toFixed(5) * 1}
                    }
                    c.segments[K].routes[j.id] = 1;
                    G = {};
                    if (o != 0)G.p = H.id;
                    if (o != J.length - 1)G.n = S.id;
                    h[k.id].merge[K] = G
                })
            }
        });
        for (var f in c.pointGroups) {
            a = c.pointGroups[f];
            for (var i in a.merge)a.merge[i].segments = b(f, i,
                false)
        }
        for (var g in c.routes) {
            a = c.routes[g].points;
            for (f = 0; f < a.length; f++) {
                var m = e.pointGroups[a[f].id].merge;
                a[f].mergeid = m[a[f == 0 ? f : f - 1].id + "_" + a[f < a.length - 1 ? f + 1 : f].id].inside;
                a[f].dir = f == 0 ? 1 : f == a.length - 1 ? -1 : 0;
                if (f > 0 && a[f].x == a[f - 1].x && a[f].y == a[f - 1].y)m[a[f].mergeid].doubled = 1
            }
        }
        for (var s in c.pointGroups) {
            a = c.pointGroups[s];
            for (var A in a.merge) {
                i = a.merge[A];
                if (i.segments) {
                    g = d(i);
                    i.angle = g;
                    i.angleDeg = Math.round(i.angle / Math.PI * 180);
                    f = i.doubled ? 0 : 0.27;
                    i.dx = (Math.sin(g) * f).toFixed(4) * 1;
                    i.dy = (-Math.cos(g) *
                        f).toFixed(4) * 1;
                    g = Math.round(i.angleDeg / 90) / 2 * Math.PI;
                    i.cdx = Math.sin(g).toFixed(0) * 1;
                    i.cdy = -Math.cos(g).toFixed(0) * 1;
                    i.relAngle = {};
                    i.order = {};
                    i.segments.forEach(function (j) {
                        i.relAngle[j.id] = {
                            angle: i.angle - c.segments[j.id].angle,
                            angleDeg: i.angleDeg - c.segments[j.id].angleDeg
                        };
                        if (j.reversed) {
                            i.relAngle[j.id].angle += Math.PI;
                            i.relAngle[j.id].angleDeg += 180
                        }
                    });
                    i.routes = {};
                    i.order = [];
                    i.segments.forEach(function (j) {
                        for (var l in c.segments[j.id].routes) {
                            i.routes[l] = j.id;
                            i.order.push(l);
                            c.segments[j.id].routes[l] =
                                j.reversed ? 2 : 3
                        }
                    })
                }
            }
        }
        return {routes: c.routes, areas: c.areas, segments: c.segments, pointGroups: c.pointGroups}
    },
    shared: {routeC: 0, topos: []},
    defaults: {
        viewScale: 1,
        iconScale: 1,
        zoomScale: 1,
        zoomOrigX: 0,
        zoomOrigY: 0,
        editable: false,
        zindex: {hover: 101, select: 100}
    },
    init: function () {
        var a = this.$element.data("topodata");
        if (!Array.isArray(a))try {
            a = JSON.parse(a)
        } catch (b) {
            alert("Malformed JSON topo data");
            return
        }
        this.model = this.parse(a);
        this.cache = this.calculate(this.model);
        this.state = {};
        var d = this;
        a.forEach(function (e,
                            c) {
            e.order = c;
            d.state[e.id] = e
        });
        this.calcPaths();
        this.render()
    },
    calcPaths: function () {
        var a = this.cache, b = this.options.viewScale;
        for (var d in a.routes) {
            var e = a.routes[d];
            e.path = "";
            var c = 0;
            e.pathParts = [];
            e.pathSegments = [];
            var f = e.points;
            if (e.points[0]) {
                e.path = "";
                for (var i = e.points.length - 1, g = 0, m = 0, s = 1, A = 2, j, l; m < i; m++) {
                    if (s > i)s = i;
                    if (A > i)A = i;
                    j = f[g].id + "_" + f[s].id;
                    l = f[m].id + "_" + f[A].id;
                    g = a.pointGroups[f[m].id].merge[j].inside;
                    A = a.pointGroups[f[s].id].merge[l].inside;
                    g = a.pointGroups[f[m].id].merge[g];
                    A = a.pointGroups[f[s].id].merge[A];
                    j = a.segments[j].routes[d] == 2 ? -1 : 1;
                    l = a.segments[l].routes[d] == 2 ? -1 : 1;
                    var h = f[m].x * b, v = f[m].y * b, k = f[s].x * b;
                    s = f[s].y * b;
                    var o = Math.sqrt((h - k) * (h - k) + (v - s) * (v - s));
                    g = [{x: h, y: v}, {x: h + g.dx * o * j, y: v + g.dy * o * j}, {
                        x: k - A.dx * o * l,
                        y: s - A.dy * o * l
                    }, {x: k, y: s}];
                    s = "";
                    A = "M" + g[0].x.toFixed(1) + " " + g[0].y.toFixed(1);
                    if (!e.path)e.path = A;
                    j = A;
                    l = e.points[m].visible;
                    e.pathParts[c] && e.pathParts[c].visible != l && c++;
                    e.pathParts[c] || (e.pathParts[c] = {svg: A, visible: l});
                    s += "C " + g[1].x.toFixed(1) + " " + g[1].y.toFixed(1) + "," + g[2].x.toFixed(1) +
                        " " + g[2].y.toFixed(1) + "," + g[3].x.toFixed(1) + " " + g[3].y.toFixed(1);
                    e.path += s;
                    j += s;
                    e.pathParts[c].svg += s;
                    e.pathSegments[m] = j;
                    g = m;
                    s = m + 2;
                    A = m + 3
                }
            }
        }
    },
    scrubStart: function (a) {
        function b(d, e) {
            var c = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            c = $(c).data("nid");
            if (c != d.touch.hover) {
                d.touch.hover && d.unhover(d.touch.hover);
                c && d.hover(c);
                d.touch.hover = c
            }
        }

        if (a.touches) {
            this.touch = {state: 0, hover: null, ox: a.targetTouches[0].clientX, oy: a.targetTouches[0].clientY};
            b(this, a);
            if (this.touch.hover) {
                a.preventDefault();
                a.stopPropagation()
            }
            this.scrubMove = function (d) {
                if (this.touch.state == 0) {
                    var e = d.targetTouches[0].clientY - this.touch.oy, c = Math.abs(d.targetTouches[0].clientX - this.touch.ox);
                    e = Math.abs(e);
                    if (c != 0 || e != 0)this.touch.state = e >= c ? -1 : 1
                }
                this.touch.state == -1 && this.scrubEnd(d, true);
                if (this.touch.state != -1) {
                    b(this, d);
                    d.preventDefault()
                }
            }.bind(this);
            this.scrubEnd = function (d, e) {
                e || d.preventDefault();
                if (this.touch.hover) {
                    var c = this.state[this.touch.hover];
                    this.unhover(this.touch.hover);
                    $(document).trigger("topotoggle",
                        {
                            e: d,
                            node: c,
                            topo: this,
                            orig: this.cache[c.type + "s"][c.id].orig,
                            editing: this.options.editable
                        })
                }
                if (window.navigator.msPointerEnabled) {
                    document.removeEventListener("MSPointerMove", this.scrubMove, true);
                    document.removeEventListener("MSPointerUp", this.scrubEnd, true)
                } else {
                    document.removeEventListener("touchmove", this.scrubMove, true);
                    document.removeEventListener("touchend", this.scrubEnd, true);
                    document.removeEventListener("touchcancel", this.scrubEnd, true)
                }
            }.bind(this);
            if (window.navigator.msPointerEnabled) {
                document.addEventListener("MSPointerMove",
                    this.scrubMove, true);
                document.addEventListener("MSPointerUp", this.scrubEnd, true)
            } else {
                document.addEventListener("touchmove", this.scrubMove, true);
                document.addEventListener("touchend", this.scrubEnd, true);
                document.addEventListener("touchcancel", this.scrubEnd, true)
            }
        }
    },
    render: function (a) {
        function b(u, p) {
            var y = document.createElementNS("http://www.w3.org/2000/svg", u);
            p && y.setAttribute("class", p);
            return y
        }

        function d(u, p, y) {
            var w = $(u);
            w.attr("data-nid", y);
            w.click(function (r) {
                $(document).trigger("topotoggle",
                    {e: r, node: p, topo: m, orig: m.cache[p.type + "s"][p.id].orig, editing: m.options.editable})
            });
            w.mouseover(function (r) {
                $(document).trigger("topohover", {el: r, node: p, topo: m, orig: m.cache[p.type + "s"][p.id].orig})
            });
            w.mouseout(function (r) {
                $(document).trigger("topounhover", {el: r, node: p, topo: m, orig: m.cache[p.type + "s"][p.id].orig})
            });
            A && A.appendChild(u)
        }

        function e(u, p) {
            u *= 1;
            u += 0.5;
            u = Math.round(u);
            p || (u += 0.5);
            return u
        }

        function c(u, p, y, w, r) {
            var q = w["class"], D = e(u.x * j, 1), z = e(u.y * j, 1), n = u.text;
            n = n.replace(/{#}/, w.num ||
                "");
            n = n.replace(/{name}/, w.name);
            for (var x = n.split(/\n/), L = [], t, C, T = 0, F = 0, E = w = 0; E < x.length; E++) {
                t = b("text", q);
                L[E] = t;
                t.textContent = x[E];
                y.append(t);
                C = t.getBBox();
                if (E == 0)T = C.height;
                if (C.width > F)F = C.width;
                w += C.height;
                t.setAttribute("x", D);
                t.setAttribute("y", z + C.height * E)
            }
            F += 1;
            var X = u.halign;
            y = u.valign;
            F = e(F, true);
            w = e(w, true);
            var ga = 0;
            if (u.expand == "d") {
                var U = O.points;
                n = function (Y, V) {
                    if (V < 0)V = U.length;
                    if (V >= U.length)V = 0;
                    var Z = U[V];
                    if (Z.y == Y.y) {
                        var W = Z.x - Y.x;
                        if (W > 0 && u || W < 0 && u) {
                            W = Math.abs(e(Z.x * j) - e(Y.x *
                                        j)) - 3;
                            if (W > F) {
                                F = W;
                                ga = Z.x > Y.x ? 1 : -1
                            }
                        }
                    }
                };
                for (C = 0; C < U.length; C++) {
                    E = U[C];
                    if (E.x == u.x && E.y == u.y) {
                        n(E, C - 1);
                        n(E, C + 1)
                    }
                }
            }
            y = y == "t" ? 1 : y == "b" ? w + 1 : e(w / 2, true) + 1;
            n = X == "l" ? 0 : X == "r" ? F + 3 : e(F / 2, true) + 2;
            if (ga == 1)n = 0;
            if (ga == -1)n = F + 3;
            for (E = 0; E < x.length; E++) {
                t = L[E];
                C = t.getBBox();
                if (X == "r")t.setAttribute("x", D - C.width / 2 + 3 + F - n); else X == "c" ? t.setAttribute("x", D + 3 + F / 2 - n) : t.setAttribute("x", D + C.width / 2 + 3 - n);
                t.setAttribute("y", z + T * (E + 1) - y)
            }
            x = b("rect", "fg " + q);
            x.setAttribute("x", D - n);
            x.setAttribute("y", z - y + 1);
            x.setAttribute("width",
                F + 3 + 1);
            x.setAttribute("height", w + 1);
            p.append(x);
            q = b("rect", "bg " + q);
            q.setAttribute("x", D - 0.5 - n);
            q.setAttribute("y", z - y + 0.5);
            q.setAttribute("width", F + 3 + 2);
            q.setAttribute("height", w + 2);
            p.prepend(q);
            if (O.label.line != "n") {
                p = e((r[2] + r[0]) / 2) - 1;
                r = e((r[3] + r[1]) / 2) - 1;
                q = "";
                q += "M " + e(D - 0.5) + " " + e(z - 0.5);
                q += "L " + p + " " + r;
                x = b("path", "line areashadow " + B["class"]);
                x.setAttribute("d", q);
                L = b("path", "line area " + B["class"]);
                L.setAttribute("d", q);
                aa.prepend(x);
                $(L).insertBefore(t);
                t = b("path", "line area " + B["class"]);
                t.setAttribute("d", q);
                d(t, B, G);
                t = p - D;
                q = r - z;
                if (O.label.line == "p") {
                    t = Math.atan2(-t, q) / Math.PI * 180;
                    q = b("g");
                    q.setAttribute("transform", "translate(" + p + "," + r + ") rotate(" + t + ")" + (l == 1 ? "" : " scale(" + l + ")"));
                    x = b("path", "head line area" + B["class"]);
                    x.setAttribute("d", "M -3 -1 L 0 5 L 3 -1 L 0 0 z");
                    $(q).append(x).appendTo(ha);
                    q = b("g");
                    q.setAttribute("transform", "translate(" + p + "," + r + ") rotate(" + t + ")" + (l == 1 ? "" : " scale(" + l + ")"));
                    x = b("path", "head line areashadow" + B["class"]);
                    x.setAttribute("d", "M -3 -1 L 0 5 L 3 -1 L 0 0 z");
                    $(q).append(x).appendTo(aa)
                }
            }
            t = b("rect", "area label");
            t.setAttribute("x", D - 0.5 - n);
            t.setAttribute("y", z - y + 0.5);
            t.setAttribute("width", F + 3 + 2);
            t.setAttribute("height", w + 2);
            return t
        }

        var f = this.cache, i = this.state;
        if (!this.$svg) {
            var g = '<svg class="topooverlay" width="100%" height="100%" viewBox="0 0 ' + this.options.width + " " + this.options.height + '">';
            g += '<g class="areas"></g>';
            g += '<g class="render"></g>';
            g += '<g class="events"></g>';
            g += "</svg>";
            this.$svg = $(g);
            this.$element.find(".canvas img").after(this.$svg);
            this.evtStart(this.$svg[0], this.scrubStart.bind(this));
            var m = this;
            this.$svg.click(function (u) {
                u.target.tagName == "svg" && m.autoZoom(u)
            });
            this.$element.hover(function () {
                $(this).parent().find(".actionable").addClass("hover")
            }, function () {
                $(this).parent().find(".actionable").removeClass("hover")
            })
        }
        if (this.$svg.find(".events").children().length == 0)a = true;
        var s = {
            endarrow: {svg: '<path id="endarrow" d="M0 -4 L-4 4 L0 3 L4 4 Z" />', zindex: 2},
            crux: {
                svg: '<path id="crux" d="M2 -2.5 L5 -7.5 L0 -7.5 L-4 .5 L-1 .5 L-3 8 L5 -2.5 Z" fill="#ff0" stroke="black" stroke-width="1"/>',
                zindex: 4, angle: "lock"
            },
            warning: {
                svg: '<g id="warning"><path d="M0 -7 L7 7.5 L-7 7.5 Z" fill="#f90" stroke="black" stroke-width="1"  /><text x="0" y="5.8" text-anchor="middle" style="font-family: Tahoma, Arial; font-size: 11px; line-height: 16px; text-align: center; font-weight: bold;">!</text></g>',
                zindex: 4,
                angle: "lock"
            },
            jumpoff: {svg: '<rect id="jumpoff" x="-5" y="-2" width="10" height="3" />', zindex: 2},
            bolt: {
                svg: '<path id="bolt" d="M-3.5 -2.5 L3.5 -2.5 L3.5 -.5 L1.5 -.5 L1.5 2.5 L-1.5 2.5 L-1.5 -.5 L-3.5 -.5 Z" />',
                zindex: 4, angle: "lock"
            },
            piton: {
                svg: '<path id="piton" d="M-2.5 -3.5 L1.5 -3.5 L2.5 -2.5 L2.5 -.5 L1.5 .5 L-0 .5  L-1 7  L-2.5 7 Z M-.5 -1.5 L1 -1.5" fill="#fff" stroke="#000" transform="rotate(90)" />',
                zindex: 4,
                angle: "lock"
            },
            draw: {
                svg: '<path id="draw" d="M-3.5 -3.5 l 1.5  0 l 2  2 l 2 -2 l 1.5  0 l 0  1.5 l-2  2 l 2  2 l 0  1.5 l-1.5  0 l-2 -2 l-2  2 l-1.5  0 l-0 -1.5 l 2 -2 l-2 -2 l 0 -1.5 Z" />',
                angle: "lock",
                zindex: 4
            },
            anchor: {
                svg: '<g id="anchor" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /></g>',
                zindex: 4, angle: "lock"
            },
            belay: {
                svg: '<g id="belay" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /></g>',
                zindex: 4,
                angle: "lock"
            },
            belaysemi: {
                svg: '<g id="belaysemi" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /><path d="M-5 0 L5 0" transform="rotate(45)"  /></g>',
                zindex: 4,
                angle: "lock"
            },
            belayhanging: {
                svg: '<g id="belayhanging" stroke="#007" stroke-width="1.3" ><circle r="5" fill="#fff" /><path d="M0 5 L0 -5" /></g>',
                zindex: 4,
                angle: "lock"
            },
            lower: {
                svg: '<path id="lower" fill="#fff" stroke="#007" d="M-1.5 5 a5 5 0 1 1 3 0 l0 3 l3.5 -1.5 l-5 10 l-5 -10 l3.5 1.5 z" stroke-width="1.3"></path>',
                zindex: 4, angle: "lock"
            },
            thread: {
                svg: '<g id="thread" transform="scale(.9)"><path stroke="#000" fill="none" d="M-3 -5 C12,7 -12,7 3,-5" stroke-width="3.6" stroke-linecap="round"></path><path stroke="#fff" fill="none" d="M-3 -5 C12,7 -12,7 3,-5" stroke-width="1.2" stroke-linecap="round"></path></g>',
                zindex: 4,
                angle: "lock"
            }
        };
        g = "<svg>";
        var A;
        if (a)A = b("g", "events");
        var j = this.options.viewScale, l = this.options.iconScale;
        if (f.areas) {
            var h = this.$svg.find(".areas");
            h.empty();
            var v = "", k = b("g", "normal"), o = b("g",
                "normal"), J = b("g", "selected"), H = b("g", "selected"), S = b("g", "hover"), K = b("g", "hover");
            h.append(k).append(o);
            h.append(J).append(H);
            h.append(S).append(K);
            for (var G in f.areas) {
                var O = f.areas[G], I = O.points, B = i[G];
                if (!(O.label.x == null || O.label.x <= 0)) {
                    var P = "", ba, ca, da, ea;
                    for (h = 0; h < I.length; h++) {
                        var M = I[h];
                        P += h == 0 ? "M" : "L";
                        var fa = e(M.x * j);
                        M = e(M.y * j);
                        if (h == 0) {
                            ba = ca = fa;
                            da = ea = M
                        } else {
                            da = Math.min(da, M);
                            ba = Math.min(ba, fa);
                            ea = Math.max(ea, M);
                            ca = Math.max(ca, fa)
                        }
                        P += fa + " " + M
                    }
                    P += "Z";
                    B["class"] || (B["class"] = "");
                    h = k;
                    I =
                        o;
                    if (this.hasClass(G, "selected"))v += " " + P;
                    if (this.hasClass(G, "hover")) {
                        h = S;
                        I = K
                    } else if (this.hasClass(G, "selected")) {
                        h = J;
                        I = H
                    }
                    var aa = $(h), ha = $(I);
                    if (P != "Z") {
                        h = b("path", "area " + B["class"] + (O.label.visible == "v" ? "" : "hidden"));
                        h.setAttribute("d", P);
                        ha.append(h);
                        h = b("path", "areashadow " + B["class"] + (O.label.visible == "v" ? "" : "hidden"));
                        h.setAttribute("d", P);
                        aa.prepend(h)
                    }
                    h = c(O.label, aa, ha, B, [ba, da, ca, ea]);
                    if (a) {
                        I = b("path", "area shape");
                        P != "Z" && I.setAttribute("d", P);
                        d(I, B, G);
                        d(h, B, G)
                    }
                }
            }
        }
        v = [];
        for (var Q in f.routes)v.push(Q);
        v.sort(function (u, p) {
            var y = i[u], w = i[p];
            return (y && y.zindex ? y.zindex : 0) - (w && w.zindex ? w.zindex : 0)
        });
        Q = "";
        g += '<g class="routes">';
        for (h = 0; h < v.length; h++) {
            var N = f.routes[v[h]];
            B = this.state[v[h]];
            var R = {};
            (function () {
                for (var u = N.points, p = false, y = 0; y < u.length; y++) {
                    var w = u[y], r = w.type;
                    if (r == "label")p = true;
                    if (y == u.length - 1 && !r)r = "endarrow";
                    if (r && s[r]) {
                        var q = w.x, D = w.y, z = f.pointGroups[q + "_" + D].merge, n = 0;
                        if ("lock" != s[r].angle) {
                            n = w.mergeid;
                            n = z[n].angleDeg ? z[n].angleDeg : z[z[n].inside].angleDeg
                        }
                        s[r].used = 1;
                        z = s[r].zindex;
                        R[z] || (R[z] = "");
                        R[z] += '<g class="' + r + '" transform="translate(' + e(q * j - 0.5, 1) + "," + e(D * j - 0.5, 1) + ") rotate(" + n + ")" + (l == 1 ? "" : " scale(" + l + ")") + '"><use xlink:href="#' + r + '" /></g>'
                    }
                }
                if (!p && N.points[0])N.points[0].type = "label"
            })();
            g += '<g class="' + (B["class"] ? B["class"] : "") + '">';
            for (k = 0; k < N.pathParts.length; k++) {
                o = N.pathParts[k];
                g += '<path class="routeshadow ' + (o.visible ? "" : "hidden ") + '" d="' + o.svg + '" />'
            }
            if (R[2])g += R[2];
            for (k = 0; k < N.pathParts.length; k++) {
                o = N.pathParts[k];
                g += '<path class="route ' + (o.visible ?
                        "" : "hidden ") + '" d="' + o.svg + '" />'
            }
            if (a && N.path) {
                I = b("path");
                I.setAttribute("d", N.path);
                d(I, B, v[h])
            }
            if (R[3])g += R[3];
            g += "</g>";
            if (R[4])Q += R[4]
        }
        g += "</g>";
        g += '<g class="zindex4">';
        g += Q;
        g += "</g>";
        g += '<g class="labels">';
        Q = {};
        for (h = 0; h < v.length; h++) {
            N = f.routes[v[h]];
            B = this.state[v[h]];
            if (B.num) {
                I = N.points;
                for (M = 0; M < I.length; M++) {
                    k = I[M];
                    o = f.pointGroups[k.id].merge[k.mergeid];
                    if (k.type == "label") {
                        o = {
                            x: k.x,
                            y: k.y,
                            rid: v[h],
                            order: B.order,
                            num: B.num,
                            cssClass: B["class"],
                            width: 16,
                            dx: o.cdx,
                            dy: o.cdy,
                            dir: k.dir
                        };
                        k = k.id;
                        Q[k] || (Q[k] = []);
                        Q[k].push(o)
                    }
                }
            }
        }
        m = this;
        $.each(Q, function (u, p) {
            var y = Math.round(p[0].x * j), w = Math.round(p[0].y * j);
            p.sort(function (F, E) {
                return F.order - E.order
            });
            for (var r = 0; r < p.length; r++) {
                var q = p[r], D = y - 0.5 - 5, z = w - 0.5 - 5, n = q.dx, x = q.dy;
                D -= n * 5 * q.dir * 1;
                z -= x * 5 * q.dir * 1;
                D -= -x * (p.length - 1) * 6;
                z -= n * (p.length - 1) * 6;
                D += -x * r * 12;
                z += n * r * 12;
                if (z > m.options.height - 12)z = m.options.height - 12;
                var L = 0, t = 0, C = 0, T = 0;
                if (n == 0)C = L = 5; else t = T = 5;
                if (r == 0) {
                    if (x < 0)T = 5;
                    if (x > 0)t = 5;
                    if (n < 0)C = 5;
                    if (n > 0)L = 5
                }
                if (r == p.length - 1) {
                    if (x < 0)t = 5;
                    if (x >
                        0)T = 5;
                    if (n < 0)L = 5;
                    if (n > 0)C = 5
                }
                g += '<g class="label ' + q.cssClass + '">';
                g += '<rect x="' + D + '" y="' + z + '" width="12" height="12" stroke="#000" fill="#fff" rx="1" ry="1" />';
                g += '<text x="' + (D + 5 + 1) + '" y="' + (z + 5 + 3.5) + '" text-anchor="middle" style="font-family: Tahoma, Arial; font-size: 8px; line-height: 16px; text-align: center;">' + q.num + "</text>";
                g += "</g>";
                if (a) {
                    n = b("rect", "routelabel");
                    n.setAttribute("x", D - T);
                    n.setAttribute("y", z - L);
                    n.setAttribute("width", 12 + T + t);
                    n.setAttribute("height", 12 + L + C);
                    d(n, m.state[q.rid],
                        q.rid)
                }
            }
        });
        g += "</g>";
        g += "<defs>";
        for (var ia in s)if (s[ia].used)g += s[ia].svg;
        g += "<pattern id=\"diagonalHatch\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"10\" height=\"10\"><line x1='-5' y1='0'  x2='10' y2='15' stroke='#08c' stroke-width='3' stroke-opacity='70%' /><line x1='0'  y1='-5' x2='15' y2='10' stroke='#08c' stroke-width='3' stroke-opacity='70%' /></pattern>";
        g += "</defs>";
        g += "</g>";
        g += "</svg>";
        this.$svg.find(".render").empty().append($(g).children());
        a && this.$svg.find(".events").empty().append($(A).children())
    },
    addPointToRoute: function () {
    },
    updatePointOnRoute: function () {
    },
    removePointFromRoute: function () {
    },
    hasClass: function (a, b) {
        var d = this.state[a];
        if (!d || !d["class"])return false;
        return (" " + d["class"] + " ").indexOf(" " + b + " ") != -1
    },
    addClass: function (a, b) {
        var d = this.state[a];
        if (!d)return false;
        d["class"] || (d["class"] = " ");
        d["class"] += " " + b + " ";
        return true
    },
    removeClass: function (a, b) {
        var d = this.state[a];
        if (d && d["class"]) {
            d["class"] = (" " + d["class"] + " ").replace(" " + b + " ", " ", "g").replace(/\s+/g, " ");
            return true
        }
    },
    overrideZindex: function (a, b) {
        var d = this.state[a];
        if (!d)return false;
        if (!d.origzindex)d.origzindex = d.zindex;
        d.zindex = b;
        return true
    },
    restoreZindex: function (a) {
        a = this.state[a];
        if (!a || !a.origzindex)return false;
        a.zindex = a.origzindex;
        return true
    },
    hover: function (a) {
        if (!this.hasClass(a, "hover")) {
            this.addClass(a, "hover");
            this.$element.addClass("cursor-pointer");
            this.overrideZindex(a, this.defaults.zindex.hover);
            this.render()
        }
    },
    unhover: function (a) {
        this.$element.removeClass("cursor-pointer");
        if (this.hasClass(a,
                "hover")) {
            this.removeClass(a, "hover");
            this.restoreZindex(a);
            this.render()
        }
    },
    select: function (a) {
        a = a.pop ? a : [a];
        for (var b = 0; b < a.length; b++) {
            var d = a[b];
            this.addClass(d, "selected");
            this.overrideZindex(d, this.defaults.zindex.select)
        }
        this.render()
    },
    deselect: function (a) {
        if (this.removeClass(a, "selected")) {
            this.restoreZindex(a);
            this.render()
        }
    },
    toggle: function (a) {
        if (this.state[a])this.hasClass(a, "selected") ? this.deselect(a) : this.select(a)
    },
    selected: function () {
        var a = [], b = this;
        $.each(this.state, function (d) {
            b.hasClass(d,
                "selected") && a.push(d)
        });
        return a
    },
    deselectAll: function () {
        var a = this;
        $.each(this.state, function (b) {
            a.removeClass(b, "selected");
            a.restoreZindex(b)
        });
        this.render()
    },
    hide: function () {
        this.$svg.hide()
    },
    show: function () {
        this.$svg.show()
    },
    evtStart: function (a, b) {
        if (window.navigator.msPointerEnabled)a.addEventListener("MSPointerDown", b, true); else {
            a.addEventListener("touchstart", b, true);
            a.addEventListener("mousedown", b, true)
        }
    },
    zoomTo: function (a, b, d, e) {
        var c = this.options.viewScale;
        this.zoomScale = d;
        var f = this.$element.find(".canvas");
        if (d == 1)this.zoomOrigY = this.zoomOrigX = 0; else {
            this.zoomOrigX = 100 * a / this.options.width * c;
            this.zoomOrigY = 100 * b / this.options.height * c
        }
        f.removeClass("animate");
        d != 1 && f.css({
            "-webkit-transform-origin": this.zoomOrigX + "% " + this.zoomOrigY + "%",
            "-ms-transform-origin": this.zoomOrigX + "% " + this.zoomOrigY + "%",
            "transform-origin": this.zoomOrigX + "% " + this.zoomOrigY + "%",
            "z-index": 2012
        });
        f.css("-webkit-transform-origin");
        f.css("-ms-transform-origin");
        f.css("transform-origin");
        f.toggleClass("zoomed", d != 1);
        f.toggleClass("animate",
            e);
        f.css({
            "-webkit-transform": "scale(" + d + ")",
            "-ms-transform": "scale(" + d + ")",
            transform: "scale(" + d + ")"
        });
        d == 1 && f.css({"z-index": "auto"});
        f.find("img[data-big]").each(function () {
            $(this).attr({src: $(this).data("big"), "data-big": null})
        })
    },
    autoZoom: function (a) {
        if (!(this.editmode && this.editmode != "select")) {
            a = this.getEventPos(a);
            var b = !this.zoomScale || this.zoomScale == 1 ? 2 : 1, d = this.options, e = $(window), c = this.$element, f = e.height() - 40, i = e.width() - 40;
            if (b != 1)if (f > b * c.height() && i > b * c.width()) {
                b = f / c.height();
                if (b >
                    i / c.width())b = i / c.width();
                if (b < 2)b = 2;
                a.y = c.offset().top - e.scrollTop() - 20;
                a.y /= f - c.height();
                a.y *= c.height();
                a.y /= d.viewScale;
                a.x = i * 0.5 - c.offset().left - c.width() * 0.5 * b - 20;
                a.x /= 1 - b
            }
            this.zoomTo(a.x, a.y, b, true)
        }
    },
    getEventPos: function (a) {
        var b, d = this.options, e = this.$element;
        if (a.targetTouches) {
            b = a.targetTouches[0].clientX;
            a = a.targetTouches[0].clientY
        } else {
            b = a.clientX;
            a = a.clientY
        }
        var c = e.offset();
        b -= c.left;
        a -= c.top;
        c = $(window);
        b += c.scrollLeft();
        a += c.scrollTop();
        c = d.viewScale;
        b /= c;
        a /= c;
        b /= e.width() / d.width;
        a /= e.height() / d.height;
        if (this.zoomScale) {
            b += this.zoomOrigX * e.width() * 0.01 * (this.zoomScale - 1) / c;
            a += this.zoomOrigY * e.height() * 0.01 * (this.zoomScale - 1) / c;
            b /= this.zoomScale;
            a /= this.zoomScale
        }
        return {x: b, y: a}
    }
};
PhotoTopo.hover = function (a) {
    $.each(PhotoTopo.prototype.shared.topos, function (b, d) {
        d.hover(a)
    })
};
PhotoTopo.unhover = function (a) {
    $.each(PhotoTopo.prototype.shared.topos, function (b, d) {
        d.unhover(a)
    })
};
PhotoTopo.select = function (a) {
    $.each(PhotoTopo.prototype.shared.topos, function (b, d) {
        d.select(a)
    })
};
PhotoTopo.deselect = function (a) {
    $.each(PhotoTopo.prototype.shared.topos, function (b, d) {
        d.deselect(a)
    })
};
PhotoTopo.toggle = function (a) {
    $.each(PhotoTopo.prototype.shared.topos, function (b, d) {
        d.toggle(a)
    })
};
(function (a, b, d) {
    a.fn.phototopo = function (e, c) {
        if (e === "hover")return PhotoTopo.hover(c);
        if (e === "unhover")return PhotoTopo.unhover(c);
        if (e === "select")return PhotoTopo.select(c);
        if (e === "deselect")return PhotoTopo.deselect(c);
        if (e === "toggle")return PhotoTopo.toggle(c);
        var f = this.data("phototopo");
        if (f) {
            if (e === "hide")return f.hide(c);
            if (e === "show")return f.show(c);
            if (e === "edit")return f.edit(c);
            if (e === "view")return f.view(c)
        }
        return this.each(function () {
            if (!a.data(this, "phototopo")) {
                var i = new PhotoTopo(this,
                    e);
                PhotoTopo.prototype.shared.topos.push(i);
                a.data(this, "phototopo", i)
            }
        })
    };
    a(".phototopo").phototopo();
    a(d).trigger("toposready")
})(jQuery, window, document);
