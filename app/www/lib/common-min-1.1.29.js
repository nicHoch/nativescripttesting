var _ = {};
_.throttle = function (a, b) {
    var c, d, f, e, j, g, i = _.debounce(function () {
        j = e = false
    }, b);
    return function () {
        c = this;
        d = arguments;
        var h = function () {
            f = null;
            j && a.apply(c, d);
            i()
        };
        f || (f = setTimeout(h, b));
        if (e)j = true; else g = a.apply(c, d);
        i();
        e = true;
        return g
    }
};
_.debounce = function (a, b, c) {
    var d;
    return function () {
        var f = this, e = arguments;
        c && !d && a.apply(f, e);
        clearTimeout(d);
        d = setTimeout(function () {
            d = null;
            c || a.apply(f, e)
        }, b)
    }
};
(function (a) {
    a.fn.keepVisible = function (b) {
        var c = {top: 0, bottom: 0}, d = this, f = this.height();
        this.width();
        var e = this.outerHeight(), j = this.outerWidth(), g = this.offset(), i = this, h, k = 0;
        if (b) {
            c.top = g.top;
            c.bottom = a(document).outerHeight() - g.top - e
        }
        h = a('<div class="placeholder" />').css({height: e, width: 10, display: "none"}).insertBefore(this);
        b = function () {
            f = d.height();
            e = d.outerHeight();
            var l = a(window).scrollTop(), n = a(window).height(), r = k;
            k = 0;
            if (l < g.top + e - n)k |= 2;
            if (l > g.top)k |= 1;
            if (k === 3)k -= 3;
            if (n < 400 || a(window).width() <
                650)k = 0;
            if (e != d.outerHeight() || j != d.outerWidth()) {
                e = d.outerHeight();
                j = d.outerWidth()
            } else if (k === r)return;
            if (k === 0) {
                h.hide();
                i.removeClass("fixed")
            } else {
                h.show().height(f);
                i.addClass("fixed")
            }
        };
        a(window).scroll(b);
        a(window).resize(b);
        b()
    }
})(jQuery);
$("body").data("uid") && $(".follow-them,.unfollow-them").click(function () {
    var a = $(this), b = a.hasClass("follow-them");
    $("body").trigger("crag.edit.start");
    updateFollowing($("body").data("uid"), a.data("uid"), b, function () {
        $("body").trigger("crag.edit.stop")
    });
    a.toggleClass("follow-them btn-success", !b);
    a.toggleClass("unfollow-them", b);
    a.html('<i class="icon-male"></i> ' + (b ? "Unfollow" : "Follow"));
    return false
});
$(document).on("topotoggle", function (a, b) {
    var c = b.orig;
    if (!b.editing)if (c.type == "area")window.location = c.url; else {
        var d = $("input[type=checkbox][value=" + c.id + "]");
        if (d.length > 0)d.attr("checked") ? $("body").trigger("node.deselect", {id: c.id}) : $("body").trigger("node.select", {id: c.id}); else window.location = c.url
    }
});
$(document).on("topohover", function (a, b) {
    var c = b.node;
    $("body").trigger("node.over", {id: c.id});
    c = b.orig;
    if (c.type == "route") {
        c = '<span class="star gold">' + c.stars + "</span>  " + c.name + ' <span class="' + c["class"] + '">' + c.grade + "</span> " + c.style;
        $("body").poshytip("enable").poshytip("update", c).poshytip("show")
    }
});
$(document).on("topounhover", function (a, b) {
    $("body").trigger("node.out", {id: b.node.id});
    $.fn.poshytip && $("body").poshytip("disable").poshytip("hide")
});
function setupKeyboard() {
    $("body").keydown(function (a) {
        var b = {37: "prev", 39: "next"}[a.keyCode];
        if (!b)return true;
        if (!$(a.target).is("body"))return true;
        if (a = $("link[rel='" + b + "']").attr("href")) {
            location = a;
            return false
        }
        b = $(b);
        if (b[0]) {
            b.focus();
            return false
        }
    })
}
function setupTooltips() {
    if ($.fn.poshytip) {
        $("#homepage *[title], #headline *[title], #content > .inner *[title][title!=''], #header *[title], #related *[title], .secondary-navigation:not(.notooltip) *[title]").poshytip({
            className: "tip-twitter",
            content: function () {
                var a = $(this).data("title.poshytip");
                if (a.indexOf(" - ") != -1)a = "<h3>" + a.replace(/ - /, "</h3>");
                return a = a.replace(/ - /g, "<br />")
            },
            fade: false,
            liveEvents: true,
            followCursor: true,
            showTimeout: 1,
            hideTimeout: 1,
            slide: false,
            alignX: "center",
            offsetT: 15,
            allowTipHover: false,
            alignTo: "cursor"
        });
        $("body").poshytip({
            shownnnnnOn: "none",
            className: "tip-twitter",
            fade: false,
            followCursor: true,
            showTimeout: 0,
            showAniDuration: 0,
            refreshAniDuration: 0,
            slide: false,
            alignX: "center",
            alignTo: "cursor"
        }).poshytip("disable")
    }
}
function menuHoverHandler(a) {
    function b(e, j) {
        function g(m, o) {
            var q = $("<a>").attr("href", thecrag_index_url({
                id: o[0],
                type: "area",
                urlStub: o[2],
                urlAncestorStub: o[3],
                trailer: f
            })).text(o[1]).attr("data-nid", o[0]).attr("data-subtype", o[5].toLowerCase());
            q = $("<li>").toggleClass("dropdown-submenu", o[4] != null).append(q).appendTo(m);
            o[4] != null && addMenuHandler(q)
        }

        j = j[0];
        if (j.length != 0) {
            if (j.length > 18 && e.find("> a").data("subtype") == "region") {
                j.sort(function (m, o) {
                    var q = m[6].toLowerCase(), s = o[6].toLowerCase();
                    if (q < s)return -1;
                    if (q > s)return 1;
                    return 0
                });
                for (var i = $('<ul class="dropdown-menu">'), h = 0; h < 5; h++) {
                    var k = String.fromCharCode(65 + h * 5), l = String.fromCharCode(65 + (h >= 4 ? 25 : h * 5 + 4)), n;
                    n = h == 4 ? j.filter(function (m) {
                        m = m[6].substring(0, 1).toUpperCase();
                        return m < "A" || m > "T"
                    }) : j.filter(function (m) {
                        m = m[6].substring(0, 1).toUpperCase();
                        return m >= k && m <= l
                    });
                    e = $('<li class="' + (n.length > 0 ? "dropdown-submenu" : "disabled") + '"><a class="">' + k + " ... " + l + "</a></li>").appendTo(i);
                    if (n.length > 0)for (var r = $('<ul class="dropdown-menu">').appendTo(e),
                                              p = 0; p < n.length; p++)g(r, n[p])
                }
            } else {
                i = $('<ul class="dropdown-menu">');
                for (p = 0; p < j.length; p++)g(i, j[p])
            }
            i.appendTo(c)
        }
    }

    var c = $(a.currentTarget);
    c.unbind("mouseenter", menuHoverHandler);
    var d = $(a.target).closest("li");
    a = d.find("> a").data("nid");
    var f = c.closest("[data-suffix]").data("suffix") || "";
    $.get("/api/node/id/" + a + "/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName]&expires=10", function (e) {
        b(d, e)
    })
}
function addMenuHandler(a) {
    a.mouseenter(menuHoverHandler)
}
addMenuHandler($("#favs li.dropdown-submenu"));
addMenuHandler($(".secondary-navigation li.dropdown-submenu:not(.group,.selected)"));
addMenuHandler($("#breadCrumbs li.subareas .seperator"));
addMenuHandler($("#breadCrumbs .world"));
function helpHoverHandler(a) {
    function b(d, f) {
        function e(i, h, k) {
            var l = $("<a>").attr("href", "/article/" + h[0]).text(h[1]);
            l = $("<li>").toggleClass("dropdown-submenu", k).append(l).appendTo(i[h[2]]);
            if (k) {
                k = $("<ul>").addClass("dropdown-menu").appendTo(l);
                i[h[2] + 1] = k
            }
        }

        f = f[0][0];
        if (f.length != 0)for (var j = ["", d], g = 0; g < f.length; g++)e(j, f[g], f[g + 1] && f[g][2] < f[g + 1][2])
    }

    a = $(a.currentTarget);
    a.unbind("mouseenter", helpHoverHandler);
    var c = a.find(".dropdown-menu");
    $.get("/api/config/articles?flatten=data[articles[label,name,level]]",
        function (d) {
            b(c, d)
        })
}
function addHelpHandler(a) {
    a.mouseenter(helpHoverHandler)
}
addHelpHandler($("#pt_help"));
function oembed(a) {
    if (!a.data("oembed-done")) {
        a.data("oembed-done", 1);
        var b = a.data("oembed-url"), c = a.html();
        if (b && c) {
            var d = a.data("provider-tag") || "unknown", f = a.data("callback") || "callback";
            b = b + "?url=" + encodeURIComponent(c) + "&format=json&" + f + "=?";
            if (document.location.protocol == "https:")b = b.replace("http:", "https:");
            $.getJSON(b, function (e) {
                var j = "";
                if (e.html) {
                    j = '<div class="oembed-container oembed-' + d + '">' + e.html + "</div>";
                    if (document.location.protocol == "https:")j = j.replace("http:", "https:")
                } else if (e.type &&
                    e.type == "photo" && e.url)j = '<a href="' + c + '"><img src="' + e.url + '" title="' + e.title + '"></a>';
                if (j) {
                    var g = (e.provider_url ? '<a href="' + e.provider_url + '">' : "") + (e.provider_name ? e.provider_name : "") + (e.provider_url ? "</a>" : ""), i = (e.license_url ? '<a href="' + e.license_url + '">' : "") + (e.license ? e.license : "") + (e.license_url ? "</a>" : "");
                    e = (e.author_url ? '<a href="' + e.author_url + '">' : "") + (e.author_name ? e.author_name : "") + (e.author_url ? "</a>" : "");
                    j = j + '<div class="oembed-credits">' + (e ? " by " + e : "") + (g ? " via " + g : "") + (i ? " (under license " +
                        i + ")" : "") + "</div>";
                    $(j).insertAfter(a);
                    a.html('<a href="' + c + '">' + c + "</a>");
                    (j = a.data("provider-tag")) && a.addClass("oembed-" + j)
                }
            })
        }
    }
}
$(function () {
    function a() {
        var g = $(".route.selected").length, i = g > 1 ? "Log " + g + " ascents" : g == 0 ? "Log ascent(s)" : "Log ascent";
        $("[name='State:LogAscent']").val(i).toggleClass("action", g > 0)
    }

    function b() {
        window.onbeforeunload = function (g) {
            if (g = g || window.event)g.returnValue = "You have unsaved data";
            return "You have unsaved data"
        }
    }

    function c() {
        window.onbeforeunload = function () {
        }
    }

    function d() {
        var g = $("#feedback");
        if (!g.length) {
            $("body").append('<div id="feedback" class="alert"></div>');
            g = $("#feedback")
        }
        if (e > 0)g.removeClass("alert-success").addClass("waiting").text("Saving").show();
        else if (j > 0) {
            g.removeClass("waiting").addClass("alert-success").text("Saved!").show(0).delay(2E3).fadeOut(500);
            c()
        } else f > 0 ? g.removeClass("alert-success").addClass("waiting").text("Loading" + Array(f + 1).join(".")).delay(700).show(0) : g.fadeOut(0);
        j = e
    }

    $("span.oembed,div.oembed").each(function () {
        oembed($(this))
    });
    $(".node-info:not(.only-mobile) .content").each(function () {
        var g = $(this).closest(".node-info");
        if ($(this).height() > 75 || screen.width < 400) {
            g.addClass("expandable");
            g.append($('<span class="comment-more"><a class="btn btn-mini" href="#">show more</a></span>'))
        }
    });
    $(".node-info.only-mobile .content").each(function () {
        $(this).closest(".node-info").append($('<span class="comment-more"><a class="btn btn-mini" href="#">show more</a></span>'))
    });
    $(".comment-more a, .node-info h2").on("click", function () {
        var g = $(this).closest(".node-info"), i = g.hasClass("expandable"), h = g.find("h2").offset().top - $(window).scrollTop();
        g.find(".content");
        var k = g.offset().top + g.outerHeight() - $(window).scrollTop();
        g.toggleClass("expandable", !i);
        g.toggleClass("contractable", i);
        var l = g.find("h2").clone().children("small").remove().end().text().toLocaleLowerCase();
        g.find(".comment-more a").text(!i ? "show more" : "hide " + l);
        g.trigger("section" + (i ? "open" : "close"));
        if (!i && h < 0) {
            g = g.offset().top + g.outerHeight();
            window.scrollTo(0, g - k)
        }
        return false
    });
    $(".node-listview .area[data-nid]").each(function (g, i) {
        var h = $(i).data("nid"), k = $(i).find(".stats .routes");
        k.html('<a href="/routes/at/' + h + '" title="Search and filter these routes">' + k.html() + "</a>");
        k = $(i).find(".stats .ticks");
        k.html('<a href="/ascents/at/' + h + '" title="Search and filter these ascents">' + k.html() + "</a>")
    });
    $("a[href*='.pdf']").click(function (g) {
        ga("send", "pageview", g.target.href)
    });
    "ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch || $(".routetable[data-hover!=false] tr, .areatable[data-hover!=false] tr, .secondary-navigation a, .routelist > div, .node-listview .route[data-nid], .node-listview .area[data-nid]").hover(function () {
        $("body").trigger("node.over", {id: $(this).closest("[data-nid]").data("nid")})
    }, function () {
        $("body").trigger("node.out", {id: $(this).closest("[data-nid]").data("nid")})
    });
    $(".showhide").on("touchstart", function (g) {
        var i = $(this).closest(".phototopo").data("phototopo"), h = $(this).find("i");
        if (h.hasClass("icon-eye-open")) {
            i.hide();
            h.attr("class", "icon-eye-close")
        } else {
            i.show();
            h.attr("class", "icon-eye-open")
        }
        g.preventDefault();
        g.stopPropagation()
    });
    $(".showhide").click(function () {
        return false
    });
    $(".showhide").hover(function () {
        $(this).closest(".phototopo").data("phototopo").hide();
        $(this).find("i").attr("class", "icon-eye-close")
    }, function () {
        $(this).closest(".phototopo").data("phototopo").show();
        $(this).find("i").attr("class", "icon-eye-open")
    });
    if (screen.width > 400) {
        setupTooltips();
        setupKeyboard();
        $("#headline:not(.nofix)").length && $("#headline").keepVisible()
    }
    $("body").bind("node.select", function (g, i) {
        window.PhotoTopo && PhotoTopo.select(i.id);
        var h = $("input[type=checkbox][value=" + i.id + "]");
        h.length > 0 && h.attr("checked", true);
        h = $(".node-listview").find(".route[data-nid=" + i.id + "],.annotation[data-aid=" + i.id + "]");
        if (h.length > 0) {
            h.addClass("selected");
            h.hasClass("route") && a();
            typeof updateDynamicListViewMenu ==
            "function" && updateDynamicListViewMenu(g, h)
        }
    });
    $("body").bind("node.deselect", function (g, i) {
        window.PhotoTopo && PhotoTopo.deselect(i.id);
        var h = $("input[type=checkbox][value=" + i.id + "]");
        h.length > 0 && h.attr("checked", false);
        h = $(".node-listview").find(".route[data-nid=" + i.id + "],.annotation[data-aid=" + i.id + "]");
        if (h.length > 0) {
            h.removeClass("selected");
            h.hasClass("route") && a();
            typeof updateDynamicListViewMenu == "function" && updateDynamicListViewMenu(g, h)
        }
    });
    $("body").bind("node.over", function (g, i) {
        var h = i.id;
        if (h) {
            $("#n" + h).addClass("hover");
            $(".node-listview .route[data-nid=" + h + "]").addClass("hover");
            $(".node-listview .area[data-nid=" + h + "]").addClass("hover");
            $(".secondary-navigation").find("a[data-nid=" + h + "]").addClass("active");
            window.PhotoTopo && PhotoTopo.hover(h)
        }
    });
    $("body").bind("node.out", function (g, i) {
        var h = i.id;
        if (h) {
            $("#n" + h).removeClass("hover");
            $(".node-listview .route[data-nid=" + h + "]").removeClass("hover");
            $(".node-listview .area[data-nid=" + h + "]").removeClass("hover");
            $(".secondary-navigation").find("a[data-nid=" +
                h + "]").removeClass("active");
            window.PhotoTopo && PhotoTopo.unhover(h)
        }
    });
    window.PhotoTopo && window.defaultSelect && PhotoTopo.select(window.defaultSelect);
    $(".node-listview :checkbox").each(function () {
        var g = $(this), i = g.is(":checked");
        g.closest(".route").toggleClass("selected", i)
    });
    $(".node-listview :checkbox").on("click", function (g) {
        var i = $(this), h = !i.is(":checked");
        i = i.closest(".route");
        g.stopPropagation();
        $("body").trigger(h ? "node.deselect" : "node.select", {id: i.data("nid")})
    });
    $(".node-listview .route[data-nid]").on("click",
        function (g) {
            if (!$(g.target).closest(".actionarea").length) {
                g = $(this);
                var i = g.find(":checkbox").is(":checked");
                $("body").trigger(i ? "node.deselect" : "node.select", {id: g.data("nid")})
            }
        });
    $(".node-listview .annotation[data-aid]").on("click", function (g) {
        if (!$(g.target).closest(".actionarea").length) {
            g = $(this);
            var i = g.hasClass("selected");
            $("body").trigger(i ? "node.deselect" : "node.select", {id: g.data("aid")})
        }
    });
    $(".node-listview .tick a").on("click", function (g) {
        g.preventDefault();
        g.stopPropagation();
        $(this).closest(".route").find(":checkbox").attr("checked",
            true);
        $(this).closest("form").find("[name='State:LogAscent']").click()
    });
    var f = 0, e = 0, j = 0;
    $("body").bind("crag.save.start", function () {
        e++;
        d()
    });
    $("body").bind("crag.save.stop", function () {
        e--;
        d()
    });
    $("body").bind("crag.load.start", function () {
        f++;
        d()
    });
    $("body").bind("crag.load.stop", function () {
        f--;
        d()
    });
    $("body").bind("crag.edit.start", function () {
        b()
    });
    $("body").bind("crag.edit.stop", function () {
        c()
    });
    $("#favorite").unbind("click").bind("click", function (g) {
        g.preventDefault();
        g = $("body").data("nid");
        var i = $("body").data("uid"), h = $("#favorite").hasClass("fav") ? 1 : 0;
        if (g && i) {
            var k = $("#favorite");
            k.find("i").attr("class", "icon-spinner");
            var l = k.next().text() * 1;
            if (h)l--; else l++;
            k.next().text(l);
            updateFavorite(i, g, 1 - h, function () {
                var n = $("#favorite");
                n.toggleClass("fav", h);
                n.find("i").removeClass("icon-spinner").toggleClass("icon-heart", !h).toggleClass("icon-heart-empty", !!h)
            })
        } else alert("Please login or sign up to add fav crags")
    });
    $("#content form.trackunsaved").delegate("input, textarea, select",
        "change", function () {
            $("body").trigger("crag.edit.start")
        });
    $("#content form.trackunsaved").submit(function () {
        $("body").trigger("crag.edit.stop")
    })
});
DAO = function () {
    var a = {};
    return {
        getNode: function (b, c) {
            if (a[b])c(a[b]); else {
                $("body").trigger("crag.load.start");
                $.get("/api/node/id/" + b + "?show=ancestors,children", null, function (d) {
                    a[b] = d.data;
                    if (d.children)a[b].children = d.children;
                    $("body").trigger("crag.load.stop");
                    c(a[b])
                }, "json")
            }
        }, getNodes: function (b, c) {
            var d = [], f = [];
            $.each(b, function (e, j) {
                if (a[j])d[e] = a[j]; else {
                    d[e] = {loading: true};
                    f.push(j)
                }
            });
            f.length == 0 ? c(d) : theCrag("/api/node/ids?show=ancestors,children&id=" + f.join(","), function (e) {
                $.each(e.data,
                    function (j, g) {
                        a[g.id] = g
                    });
                $.each(b, function (j, g) {
                    d[j] = a[g]
                });
                c(d)
            })
        }, search: function (b, c, d) {
            if (typeof c === "function") {
                d = c;
                c = {}
            }
            b = encodeURIComponent(b);
            theCrag("/api/node" + (c.nodeID ? "" : "") + "/search?search=" + b + (c.stopifexact ? "&stopifexact=" + c.stopifexact : "") + (c.oftype ? "&oftype=" + c.oftype : ""), function (f) {
                var e = [];
                if (f && f.data)e = f.data;
                d(e)
            })
        }, getAccount: function (b, c) {
            theCrag("/api/climber/id/" + b, function (d) {
                var f = {};
                if (d && d.data)f = d.data;
                c(f)
            })
        }, mapAccountLabel: function (b, c) {
            theCrag("/api/climber/label/" +
                encodeURIComponent(b), function (d) {
                var f = {};
                if (d && d.data)f = d.data;
                c(f)
            })
        }, mapAccountEmail: function (b, c) {
            theCrag("/api/climber/email/" + encodeURIComponent(b), function (d) {
                var f = {};
                if (d && d.data)f = d.data;
                c(f)
            })
        }, lookupCrag: function (b, c, d) {
            if (typeof c === "function") {
                d = c;
                c = ""
            }
            theCrag("/api/lookup/crag?page=1&page-size=20&search=" + encodeURIComponent(b) + (c ? "&mode=" + c : ""), function (f) {
                var e = {};
                if (f && f.data)e = f.data;
                d(e)
            })
        }, lookupClimber: function (b, c, d) {
            if (typeof c === "function") {
                d = c;
                c = "all"
            }
            theCrag("/api/lookup/climber?page=1&page-size=20&search=" +
                encodeURIComponent(b) + (c ? "&mode=" + c : ""), function (f) {
                var e = {};
                if (f && f.data)e = f.data;
                d(e)
            })
        }, forumID: function (b, c) {
            theCrag("/api/node/id/" + b + "/forumid", function (d) {
                var f = {};
                if (d && d.data)f = d.data;
                c(f)
            })
        }, accountSearch: function (b, c, d) {
            if (typeof c === "function") {
                d = c;
                c = {}
            }
            b = "/api/climber/search?search=" + encodeURIComponent(b) + (c.stopifexact ? "&stopifexact=" + c.stopifexact : "");
            theCrag(b, function (f) {
                var e = [];
                if (f && f.data)e = f.data;
                d(e)
            })
        }
    }
}();
var theCrag = function () {
    var a = Array.prototype.slice.call(arguments);
    $("body").trigger("crag.load.start");
    var b = a.shift();
    if (!b || b.substr(0, 1) == "/") {
        a.unshift(b);
        b = "GET"
    }
    var c = a.shift(), d = a.shift();
    if (typeof d === "function") {
        a.unshift(d);
        d = {}
    }
    var f = a.shift();
    a = a.shift();
    if (d)d = JSON.stringify(d);
    b = $.ajax({processData: false, type: b, url: c, data: d, success: f, error: a});
    b.always(function () {
        $("body").trigger("crag.load.stop")
    });
    return b
};
function postAPI(a, b, c, d) {
    a = a.match(/\?/) ? a + "&cookieAuth=1" : a + "?cookieAuth=1";
    $.ajax({
        type: "POST",
        url: a,
        data: b,
        dataType: "json",
        contentType: "application/json",
        success: c,
        error: function (f, e, j) {
            "undefined" === typeof d ? alert("api post error: " + j + ":" + e + ":" + f.responseText) : d(f, e, j)
        }
    })
}
function postAPIWithPromise(a, b) {
    a = a.match(/\?/) ? a + "&cookieAuth=1" : a + "?cookieAuth=1";
    return $.ajax({type: "POST", url: a, data: b, dataType: "json", contentType: "application/json"})
}
function getIDsFromAttr(a, b, c) {
    for (var d = {}, f = "", e = 0; e < c.length; e++) {
        d[c[e]] = 0;
        f += "_([0-9]+)"
    }
    e = RegExp(f);
    if (a.attr(b)) {
        a = a.attr(b).match(e);
        if (a instanceof Array)for (e = 0; e < c.length; e++)d[c[e]] = a[e + 1]
    }
    return d
}
function addRouteToCircuit(a, b, c, d) {
    url = "/api/circuit/update";
    atom = {submittor: a, circuit: b, routes: [{action: "add", nodeID: c}]};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function starCircuit(a, b, c, d) {
    url = "/api/climber/update";
    atom = {account: a, circuit: [{action: c, id: b}]};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function updateFavorite(a, b, c, d) {
    url = "/api/climber/update";
    atom = {account: a, favorite: [{node: b, status: c}]};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function updateFollowing(a, b, c, d) {
    url = "/api/climber/update";
    atom = {account: a, follow: [{account: b, status: c}]};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function updateLastFeed(a, b, c) {
    url = "/api/climber/update";
    atom = {account: a, lastFeed: b};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, c)
}
function updateUserPrefs(a, b, c, d) {
    url = "/api/climber/update";
    atom = {account: a, preference: {}};
    atom.preference[b] = c;
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function adminUpdateUserMeta(a, b, c, d, f) {
    url = "/api/climber/update";
    atom = {account: a, adminUpdate: 1, refArea: d, meta: {}};
    atom.meta[b] = c;
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, f)
}
function sendIt(a, b, c) {
    a = JSON.stringify({data: a});
    postAPI("/api/message/send?markupType=html", a, b, c);
    return true
}
$(function () {
    $(".loggedin .unknown").hover(function () {
        var a = $(this), b = ["Boulder", "Trad", "Sport", "Top rope", "DWS", "Aid", "Via ferrata", "Ice", "Alpine", "Unknown"], c = $("body").data("uid"), d = a.closest("[data-nid]");
        if (d.prop("tagName") != "BODY")(d = d.data("nid")) && createDynamicSytleSelection(b, a, c, d, function (f) {
            a.html(f.html()).attr("class", f.attr("class"))
        })
    }, function () {
        $("#style-dynamic").remove()
    })
});
function createDynamicSytleSelection(a, b, c, d, f) {
    $("#style-dynamic").remove();
    var e = b.position(), j = '<ul id="style-dynamic" class="dropdown-menu" style="margin-top:1px">';
    j += "<li><p><strong>Know this route's style?</strong></p></li>";
    for (var g = 0; g < a.length; g++)j += '<li style="display:block"><a href="#"><span class="tags ' + a[g].toLowerCase() + '">' + a[g] + "</span></a></li>";
    j += "</ul>";
    $(j).hide().appendTo(b).css({
        position: "absolute",
        "z-index": 1E3,
        top: e.top + b.innerHeight() + 1,
        left: e.left
    }).show().find("a").bind("click",
        function (i) {
            var h = $(this).find(".tags"), k = h.text();
            f(h);
            $("#style-dynamic").remove();
            updateStyle(c, d, k, function () {
            });
            i.preventDefault();
            return false
        })
}
function updateStyle(a, b, c, d) {
    url = "/api/route/update";
    atom = {submittor: a, node: b, gearStyle: c};
    data = {data: atom};
    json = JSON.stringify(data);
    postAPI(url, json, d)
}
function thecrag_index_url(a, b) {
    b = b ? b : {};
    var c = b.type ? b.type : a.type ? a.type : "area", d = b.trailer ? b.trailer : a.trailer ? a.trailer : "", f = b["default"] ? b["default"] : "", e = "";
    if (c.match(/^(area|route)$/))e = a.urlStub ? "/climbing/" + a.urlStub : a.urlAncestorStub ? "/climbing/" + a.urlAncestorStub + "/" + c + "/" + a.id : f ? f : "/" + c + "/" + a.id;
    if (d)e += (d.match(/^[\/\?]/) ? "" : "/") + d;
    return e
}
function escapeHTML(a) {
    return a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
}
function isBlank(a) {
    return !a || /^\s*$/.test(a)
}
(function (a) {
    window.MBP = window.MBP || {};
    MBP.viewportmeta = a.querySelector && a.querySelector('meta[name="viewport"]');
    MBP.fixOrient = function () {
        MBP.viewportmeta.content = (Math.abs(window.orientation) == 90 ? "width=device-width,height=device-height" : "width=device-height,height=device-width") + ",initial-scale=1.0,user-scalable=no,minimum-scale=1,maximum-scale=1"
    };
    MBP.preventZoom = function () {
        if (!a.querySelectorAll)for (var b = a.querySelectorAll("input, select, textarea"), c = 0, d = b.length, f = function () {
            MBP.viewportmeta.content =
                "width=device-width,initial-scale=1,maximum-scale=1"
        }, e = function () {
            MBP.viewportmeta.content = "width=device-width,initial-scale=1,maximum-scale=10"
        }; c < d; c++) {
            b[c].onfocus = f;
            b[c].onblur = e
        }
    };
    MBP.autogrow = function (b, c) {
        function d() {
            var j = this.scrollHeight;
            if (j > this.clientHeight)this.style.height = j + 3 * e + "px"
        }

        var f = c ? c : 12, e = b.currentStyle ? b.currentStyle.lineHeight : getComputedStyle(b, null).lineHeight;
        e = e.indexOf("px") == -1 ? f : parseInt(e, 10);
        b.style.overflow = "hidden";
        b.addEventListener ? b.addEventListener("input",
            d, false) : b.attachEvent("onpropertychange", d)
    };
    MBP.BODY_SCROLL_TOP = false;
    MBP.getScrollTop = function () {
        return window.pageYOffset || a.compatMode === "CSS1Compat" && a.documentElement.scrollTop || a.body.scrollTop || 0
    };
    MBP.hideUrlBar = function () {
        var b = window;
        if (!location.hash && MBP.BODY_SCROLL_TOP !== false)b.scrollTo(0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1)
    };
    MBP.hideUrlBarOnLoad = function () {
        var b = window, c = b.document, d;
        if (!location.hash && b.addEventListener) {
            window.scrollTo(0, 1);
            MBP.BODY_SCROLL_TOP = 1;
            d = setInterval(function () {
                if (c.body) {
                    clearInterval(d);
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar()
                }
            }, 15);
            b.addEventListener("load", function () {
                setTimeout(function () {
                    MBP.getScrollTop() < 20 && MBP.hideUrlBar()
                }, 0)
            })
        }
    }
})(document);
MBP.preventZoom();
MBP.hideUrlBar();
function FastClick(a) {
    var b, c = this;
    this.trackingClick = false;
    this.trackingClickStart = 0;
    this.targetElement = null;
    this.lastTouchIdentifier = this.touchStartY = this.touchStartX = 0;
    this.touchBoundary = 10;
    this.layer = a;
    if (!a || !a.nodeType)throw new TypeError("Layer must be a document node");
    this.onClick = function () {
        return FastClick.prototype.onClick.apply(c, arguments)
    };
    this.onMouse = function () {
        return FastClick.prototype.onMouse.apply(c, arguments)
    };
    this.onTouchStart = function () {
        return FastClick.prototype.onTouchStart.apply(c,
            arguments)
    };
    this.onTouchEnd = function () {
        return FastClick.prototype.onTouchEnd.apply(c, arguments)
    };
    this.onTouchCancel = function () {
        return FastClick.prototype.onTouchCancel.apply(c, arguments)
    };
    if (!FastClick.notNeeded(a)) {
        if (this.deviceIsAndroid) {
            a.addEventListener("mouseover", this.onMouse, true);
            a.addEventListener("mousedown", this.onMouse, true);
            a.addEventListener("mouseup", this.onMouse, true)
        }
        a.addEventListener("click", this.onClick, true);
        a.addEventListener("touchstart", this.onTouchStart, false);
        a.addEventListener("touchend",
            this.onTouchEnd, false);
        a.addEventListener("touchcancel", this.onTouchCancel, false);
        if (!Event.prototype.stopImmediatePropagation) {
            a.removeEventListener = function (d, f, e) {
                var j = Node.prototype.removeEventListener;
                d === "click" ? j.call(a, d, f.hijacked || f, e) : j.call(a, d, f, e)
            };
            a.addEventListener = function (d, f, e) {
                var j = Node.prototype.addEventListener;
                d === "click" ? j.call(a, d, f.hijacked || (f.hijacked = function (g) {
                        g.propagationStopped || f(g)
                    }), e) : j.call(a, d, f, e)
            }
        }
        if (typeof a.onclick === "function") {
            b = a.onclick;
            a.addEventListener("click",
                function (d) {
                    b(d)
                }, false);
            a.onclick = null
        }
    }
}
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf("Android") > 0;
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent);
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && /OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);
FastClick.prototype.needsClick = function (a) {
    switch (a.nodeName.toLowerCase()) {
        case "button":
        case "select":
        case "textarea":
            if (a.disabled)return true;
            break;
        case "input":
            if (this.deviceIsIOS && a.type === "file" || a.disabled)return true;
            break;
        case "label":
        case "video":
            return true
    }
    return /\bneedsclick\b/.test(a.className)
};
FastClick.prototype.needsFocus = function (a) {
    switch (a.nodeName.toLowerCase()) {
        case "textarea":
        case "select":
            return true;
        case "input":
            switch (a.type) {
                case "button":
                case "checkbox":
                case "file":
                case "image":
                case "radio":
                case "submit":
                    return false
            }
            return !a.disabled && !a.readOnly;
        default:
            return /\bneedsfocus\b/.test(a.className)
    }
};
FastClick.prototype.sendClick = function (a, b) {
    var c, d;
    document.activeElement && document.activeElement !== a && document.activeElement.blur();
    d = b.changedTouches[0];
    c = document.createEvent("MouseEvents");
    c.initMouseEvent("click", true, true, window, 1, d.screenX, d.screenY, d.clientX, d.clientY, false, false, false, false, 0, null);
    c.forwardedTouchEvent = true;
    a.dispatchEvent(c)
};
FastClick.prototype.focus = function (a) {
    var b;
    if (this.deviceIsIOS && a.setSelectionRange) {
        b = a.value.length;
        a.setSelectionRange(b, b)
    } else a.focus()
};
FastClick.prototype.updateScrollParent = function (a) {
    var b, c;
    b = a.fastClickScrollParent;
    if (!b || !b.contains(a)) {
        c = a;
        do {
            if (c.scrollHeight > c.offsetHeight) {
                b = c;
                a.fastClickScrollParent = c;
                break
            }
            c = c.parentElement
        } while (c)
    }
    if (b)b.fastClickLastScrollTop = b.scrollTop
};
FastClick.prototype.getTargetElementFromEventTarget = function (a) {
    if (a.nodeType === Node.TEXT_NODE)return a.parentNode;
    return a
};
FastClick.prototype.onTouchStart = function (a) {
    var b, c, d;
    if (a.targetTouches.length > 1)return true;
    b = this.getTargetElementFromEventTarget(a.target);
    c = a.targetTouches[0];
    if (this.deviceIsIOS) {
        d = window.getSelection();
        if (d.rangeCount && !d.isCollapsed)return true;
        if (!this.deviceIsIOS4) {
            if (c.identifier === this.lastTouchIdentifier) {
                a.preventDefault();
                return false
            }
            this.lastTouchIdentifier = c.identifier;
            this.updateScrollParent(b)
        }
    }
    this.trackingClick = true;
    this.trackingClickStart = a.timeStamp;
    this.targetElement = b;
    this.touchStartX =
        c.pageX;
    this.touchStartY = c.pageY;
    a.timeStamp - this.lastClickTime < 200 && a.preventDefault();
    return true
};
FastClick.prototype.touchHasMoved = function (a) {
    a = a.changedTouches[0];
    var b = this.touchBoundary;
    if (Math.abs(a.pageX - this.touchStartX) > b || Math.abs(a.pageY - this.touchStartY) > b)return true;
    return false
};
FastClick.prototype.findControl = function (a) {
    if (a.control !== undefined)return a.control;
    if (a.htmlFor)return document.getElementById(a.htmlFor);
    return a.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")
};
FastClick.prototype.onTouchEnd = function (a) {
    var b, c, d = this.targetElement;
    if (this.touchHasMoved(a)) {
        this.trackingClick = false;
        this.targetElement = null
    }
    if (!this.trackingClick)return true;
    if (a.timeStamp - this.lastClickTime < 200)return this.cancelNextClick = true;
    this.lastClickTime = a.timeStamp;
    b = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;
    if (this.deviceIsIOSWithBadTarget) {
        c = a.changedTouches[0];
        d = document.elementFromPoint(c.pageX - window.pageXOffset, c.pageY - window.pageYOffset) ||
            d;
        d.fastClickScrollParent = this.targetElement.fastClickScrollParent
    }
    c = d.tagName.toLowerCase();
    if (c === "label") {
        if (b = this.findControl(d)) {
            this.focus(d);
            if (this.deviceIsAndroid)return false;
            d = b
        }
    } else if (this.needsFocus(d)) {
        if (a.timeStamp - b > 100 || this.deviceIsIOS && window.top !== window && c === "input") {
            this.targetElement = null;
            return false
        }
        this.focus(d);
        if (!this.deviceIsIOS4 || c !== "select") {
            this.targetElement = null;
            a.preventDefault()
        }
        return false
    }
    if (this.deviceIsIOS && !this.deviceIsIOS4)if ((b = d.fastClickScrollParent) &&
        b.fastClickLastScrollTop !== b.scrollTop)return true;
    if (!this.needsClick(d)) {
        a.preventDefault();
        this.sendClick(d, a)
    }
    return false
};
FastClick.prototype.onTouchCancel = function () {
    this.trackingClick = false;
    this.targetElement = null
};
FastClick.prototype.onMouse = function (a) {
    if (!this.targetElement)return true;
    if (a.forwardedTouchEvent)return true;
    if (!a.cancelable)return true;
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
        if (a.stopImmediatePropagation)a.stopImmediatePropagation(); else a.propagationStopped = true;
        a.stopPropagation();
        a.preventDefault();
        return false
    }
    return true
};
FastClick.prototype.onClick = function (a) {
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true
    }
    if (a.target.type === "submit" && a.detail === 0)return true;
    a = this.onMouse(a);
    if (!a)this.targetElement = null;
    return a
};
FastClick.prototype.destroy = function () {
    var a = this.layer;
    if (this.deviceIsAndroid) {
        a.removeEventListener("mouseover", this.onMouse, true);
        a.removeEventListener("mousedown", this.onMouse, true);
        a.removeEventListener("mouseup", this.onMouse, true)
    }
    a.removeEventListener("click", this.onClick, true);
    a.removeEventListener("touchstart", this.onTouchStart, false);
    a.removeEventListener("touchend", this.onTouchEnd, false);
    a.removeEventListener("touchcancel", this.onTouchCancel, false)
};
FastClick.notNeeded = function (a) {
    var b;
    if (typeof window.ontouchstart === "undefined")return true;
    if (/Chrome\/[0-9]+/.test(navigator.userAgent))if (FastClick.prototype.deviceIsAndroid) {
        if ((b = document.querySelector("meta[name=viewport]")) && b.content.indexOf("user-scalable=no") !== -1)return true
    } else return true;
    if (a.style.msTouchAction === "none")return true;
    return false
};
FastClick.attach = function (a) {
    return new FastClick(a)
};
function subURLArg(a, b, c) {
    var d = RegExp("([?])" + b + "=[^&]*&?", "g");
    a = a.replace(d, "$1");
    d = RegExp("&" + b + "=[^&]*", "g");
    a = a.replace(d, "");
    a = a.replace(/[?&]+$/, "");
    if (typeof c !== "undefined") {
        a.match(/[?]/) || (a += "?");
        a.match(/[?]$/) || (a += "&");
        a += b + "=" + c
    }
    return a
}
var URLReplace = {
    resolver: {}, functions: {}, resolve: function (a) {
        if ("undefined" === typeof URLReplace.resolver[a])URLReplace.resolver[a] = $.Deferred();
        URLReplace.resolver[a].resolve()
    }, resolveTrigger: function (a, b) {
        var c = a.data("replace-resolve");
        if (c && c.length) {
            if ("undefined" === typeof URLReplace.resolver[c])URLReplace.resolver[c] = $.Deferred();
            URLReplace.resolver[c].done(function () {
                URLReplace.trigger(a, b)
            })
        } else URLReplace.trigger(a, b)
    }, trigger: function (a, b) {
        var c = b || {}, d = a.data("replace-url");
        if (!d || !d.length) {
            alert("Error: no stream-url defined");
            return false
        }
        var f = a.data("replace-container");
        if (!f || !f.length) {
            alert("Error: no replace-container defined");
            return false
        }
        f = a.closest(f);
        var e = a.data("replace-content");
        if (!e || !e.length) {
            alert("Error: no replace-content defined");
            return false
        }
        e = f.find(e);
        f.find(".replace-notification").remove();
        a.blur();
        if ("undefined" === typeof c.url)c.url = d;
        d = a.data("replace-mode");
        c.mode = d && d.length ? d : "append";
        if ((d = a.data("replace-prepare")) && d.length && "undefined" !== typeof URLReplace.functions[d])c = URLReplace.functions[d](a,
            f, e, c);
        if ((d = a.data("replace-function")) && d.length && "undefined" !== typeof URLReplace.functions[d])c.embedder = URLReplace.functions[d];
        URLReplace.embed(a, f, e, c)
    }, embed: function (a, b, c, d) {
        a.before('<div class="waiting" style="height:5em;"></div>');
        $.ajax(d.url).done(function (f) {
            b.find(".waiting").remove();
            if ("undefined" === typeof d.embedder)if (d.mode == "append")c.append(f); else d.mode == "replace" && c.html(f); else d.embedder(a, b, c, d, f)
        }).fail(function () {
            b.find(".waiting").remove();
            var f = subURLArg(d.url, "embed",
                "off");
            $(".stream").append('<p class="replace-notification">Failed to get stream, please refresh the page to see if the problem was temporary or click the direct url <a href="' + f + '">' + f + "</a></p>")
        })
    }
};
(function () {
    $("body").on("click", "[data-replace-url]", function (a) {
        a.preventDefault();
        URLReplace.resolveTrigger($(this), {init: 0})
    });
    $(".replace-initialise[data-replace-url]").each(function () {
        URLReplace.resolveTrigger($(this), {init: 1})
    })
})();
var ImageUploadRotate = {
    anticlockwise_stub: ["filters:rotate(90)/", "", "filters:rotate(270)/", "filters:rotate(180)/"],
    anticlockwise_position: [3, 0, 1, 2],
    clockwise_stub: ["filters:rotate(270)/", "filters:rotate(180)/", "filters:rotate(90)/", ""],
    clockwise_position: [1, 2, 3, 0],
    positions: {},
    init_image: function (a, b) {
        ImageUploadRotate.positions[a] = b
    },
    rotate_anticlockwise: function (a) {
        $("body").trigger("crag.load.start");
        var b = a.data("id"), c = {data: {group: a.data("group"), id: b, anticlockwise: 1}};
        c = JSON.stringify(c);
        postAPI("/api/image/transform",
            c, function () {
                var d = ImageUploadRotate.anticlockwise_stub[ImageUploadRotate.positions[b]];
                ImageUploadRotate.positions[b] = ImageUploadRotate.anticlockwise_position[ImageUploadRotate.positions[b]];
                d = a.data("server") + a.data("url-size-stub") + d + a.data("url-hash-stub");
                a.html('<img src="' + d + '" />');
                $("body").trigger("crag.load.stop")
            })
    },
    rotate_clockwise: function (a) {
        $("body").trigger("crag.load.start");
        var b = a.data("id"), c = {data: {group: a.data("group"), id: b, clockwise: 1}};
        c = JSON.stringify(c);
        postAPI("/api/image/transform",
            c, function () {
                var d = ImageUploadRotate.clockwise_stub[ImageUploadRotate.positions[b]];
                ImageUploadRotate.positions[b] = ImageUploadRotate.clockwise_position[ImageUploadRotate.positions[b]];
                d = a.data("server") + a.data("url-size-stub") + d + a.data("url-hash-stub");
                a.html('<img src="' + d + '" />');
                $("body").trigger("crag.load.stop")
            })
    }
};
(function () {
    $(".image-container").each(function () {
        var a = 0;
        if ($(this).data("position"))a = $(this).data("position");
        id = $(this).data("id");
        ImageUploadRotate.init_image(id, a)
    });
    $(".rotate-clockwise").click(function () {
        var a = $(this).parent().find("[data-group]");
        ImageUploadRotate.rotate_clockwise(a)
    });
    $(".rotate-anticlockwise").click(function () {
        var a = $(this).parent().find("[data-group]");
        ImageUploadRotate.rotate_anticlockwise(a)
    })
})();
