/**

 ############
#            #   _   _           ____                 
#       __   #  | |_| |__   ___ / ___|_ __ __ _  __ _ 
#     _/..\  #  | __| '_ \ / _ \ |   | '__/ _` |/ _` |
#___-/.....\ #  | |_| | | |  __/ |___| | | (_| | (_| |
#...........-#   \__|_| |_|\___|\____|_|  \__,_|\__, |
#............#                                  |___/ 
 ############


This is for ALL js which is common to the whole site, like tooltip hovers, headline fixed behaviours

If behaviour is specific to just the area or list templates then it should be in a seperate script

*/

// from underscore.js
  var _ = {};

  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };



(function($){

	$.fn.keepVisible = function(keepInside){
		// if no parent id then
		var margin = {
			top: 0,
			bottom: 0
			},
			that = this,
			height = this.height(),
			width  = this.width(),
			outerHeight = this.outerHeight(),
			outerWidth  = this.outerWidth(),
			offset = this.offset(),
			slider = this,
			placeHolder,
			modeFlow = 0, modeTop = 1, modeBottom = 2,
			mode = modeFlow,
			check;

		if (keepInside){
			margin.top = offset.top;
			margin.bottom = $(document).outerHeight() - offset.top - outerHeight;
		}

		// make a placeholder
		placeHolder = $('<div class="placeholder" />')
			.css({height: outerHeight, width: 10, display: 'none'})
			.insertBefore(this);

		// make the 
		check = function(){
			height = that.height();
			outerHeight = that.outerHeight();
			//offset = that.offset();
			var scrollTop = $(window).scrollTop(),
				winHeight = $(window).height(),
				oldMode = mode;
			mode = modeFlow;

			// has the slider overlapped the window frame?
			if (scrollTop < offset.top + outerHeight - winHeight ){
				mode |= modeBottom;
			}
			if (scrollTop > offset.top ){
				mode |= modeTop;
			}

			// if both the top and bottom overlap then put it back into flow mode
			if (mode === (modeTop | modeBottom)){ mode -= modeTop | modeBottom; }

			if (winHeight < 400 || $(window).width() < 650){
				mode = modeFlow;
			}

			if (outerHeight != that.outerHeight() ||
				outerWidth  != that.outerWidth() ){
				outerHeight = that.outerHeight();
				outerWidth  = that.outerWidth();
			} else {
				if (mode === oldMode){ return; }
			}

			if (mode === modeFlow){
				placeHolder.hide();
				slider.removeClass('fixed')
				return;
			}
			placeHolder.show().height(height);
			slider.addClass('fixed');

		};
		$(window).scroll(check);
		$(window).resize(check);
		check();
	};


})(jQuery);

// Follow / unfollow buttons

if ($('body').data('uid')){
    $(".follow-them,.unfollow-them").click(function(e){
        var $el = $(this);
        var fol = $el.hasClass('follow-them');
		$('body').trigger('crag.edit.start');
        updateFollowing($('body').data('uid'),$el.data('uid'),fol,function(){
		    $('body').trigger('crag.edit.stop');
        });
        $el.toggleClass('follow-them btn-success', !fol);
        $el.toggleClass('unfollow-them', fol);
        $el.html('<i class="icon-male"></i> ' +  (fol ? 'Unfollow' : 'Follow') );
        return false;
    });
}



$(document).on('topotoggle',  function(e,data){
    var node = data.orig;
    if (data.editing){
        return;
    }
	if (node.type == 'area'){
		window.location = node.url;
    } else {

        // Ask the page, is it selectable
        var $check = $('input[type=checkbox][value='+node.id+']');
        if ($check.length > 0){
            // If yes, then select or deselect it
            if ($check.attr('checked')){
                $('body').trigger('node.deselect', {id: node.id});
            } else {
                $('body').trigger('node.select',   {id: node.id});
            }

        } else {
            // If not then navigate to it (eg cross area topo, or route page)
		    window.location = node.url;
        }

    }
});
$(document).on('topohover',   function(e,data){

    // Only code specific to topos go here's, the rest delegate to node.over
    var node = data.node;

	$('body').trigger('node.over', {id: node.id});
	var o = data.orig;

	if (o.type != 'route'){ return; }

	var name = '<span class="star gold">' + o.stars + '</span> '
            + ' '
            + o.name
            + ' <span class="'+o['class']+'">' + o.grade + '</span> '
//            + ' <span class="tags ' + o.style.toLowerCase() + '">' + o.style + '</span>';
            + o.style;
	$('body')
        .poshytip('enable')
        .poshytip('update', name)
        .poshytip('show');
});
$(document).on('topounhover', function(e,data){

    // Only code specific to topos go here's, the rest delegate to node.over
	$('body').trigger('node.out', {id: data.node.id});
	if( !$.fn.poshytip){
		return;
	}
	$('body').poshytip('disable').poshytip('hide');
});


function setupKeyboard(){
	$("body").keydown(function(e) {
		var keyMap = {
			37: 'prev',
			//38: 'up', // don't mess with normal scroll nav
			39: 'next'
			// 191: '#searchForm input' // '/' and '?' character - disabled because it stops blocks text area inputs
		};
		var link = keyMap[e.keyCode];
		if (!link) return true;
		var focus = $(e.target).is('body');
		if (!focus){ return true; }
		var href = $("link[rel='"+link+"']").attr('href');
		if (href){
			location = href;
			return false;
		}
		var elem = $(link);
		if (elem[0]){
			elem.focus();
			return false;
		}
	});
}


function setupTooltips(){

	if( !$.fn.poshytip){
		return;
	}


	$("#homepage *[title], #headline *[title], #content > .inner *[title][title!=''], #header *[title], #related *[title], .secondary-navigation:not(.notooltip) *[title]").poshytip({
		className: 'tip-twitter',
		content: function(callback){
			var tip = $(this).data('title.poshytip');
			if (tip.indexOf(' - ') != -1){
				tip = '<h3>'+tip.replace(/ - /, '</h3>');
			}
			tip = tip.replace(/ - /g, '<br />');
			return tip;
		},
		fade: false,
		liveEvents: true,
		followCursor: true,
		showTimeout: 1,
		hideTimeout: 1,
		slide: false,
		alignX: 'center',
		offsetT: 15,
		allowTipHover: false,
		alignTo:'cursor'
	 });
//	$(".notooltip *[title]").poshytip('destroy');
	// This one is spare for topo, maps and other dynamic tooltips
	$('body').poshytip({
		shownnnnnOn: 'none',
		className: 'tip-twitter',
		fade: false,
		followCursor: true,
		showTimeout: 0,
		showAniDuration: 0,
		refreshAniDuration: 0,
		slide: false,
		alignX: 'center',
		alignTo: 'cursor'
	}).poshytip('disable');
}



function menuHoverHandler(e){
	var $e = $(e.currentTarget);
	$e.unbind('mouseenter', menuHoverHandler);
	var $li = $(e.target).closest('li');
	var nid = $li.find('> a').data('nid');
	var suffix = $e.closest('[data-suffix]').data('suffix') || '';
	function menuLoadHandler ($li, data){
        data = data[0];

        function addItem($l, item){
            var a = $('<a>').attr('href', thecrag_index_url({
                id :item[0],
                'type': 'area',
                urlStub: item[2],
                urlAncestorStub: item[3],
                trailer: suffix
            } ) )
                .text(item[1])
                .attr('data-nid',item[0])
                .attr('data-subtype',item[5].toLowerCase())
                ;
            var $li = $('<li>').toggleClass('dropdown-submenu', item[4] != null).append(a).appendTo($l);
            if (item[4] != null){
                addMenuHandler( $li );
            }
        }

        if (data.length == 0) return;
        if (data.length > 18 && $li.find('> a').data('subtype') == 'region'){

            data.sort(function(a,b){
                var nameA=a[6].toLowerCase(), nameB=b[6].toLowerCase();
                if (nameA < nameB) return -1 ;
                if (nameA > nameB) return 1;
                return 0;
            });

            var $l = $('<ul class="dropdown-menu">');
            for(var al=0; al<5; al++){
                var start = String.fromCharCode(65 + al * 5);
                var end   = String.fromCharCode(65 + (al >= 4 ? 25 : al * 5 + 4));
                var children;
                if (al==4){
                    // special case for last one to catch everything
                    children = data.filter(function(e){
                        var letter = e[6].substring(0,1).toUpperCase();
                        return letter < 'A' || letter > 'T';
                    });
                } else {
                    children = data.filter(function(e){
                        var letter = e[6].substring(0,1).toUpperCase();
                        return letter >= start && letter <= end;
                    });
                }

                var $li = $('<li class="'+(children.length>0?'dropdown-submenu':'disabled')+'"><a class="">' + start+' ... '+end+'</a></li>').appendTo($l);
                if (children.length > 0){
                    var $ul = $('<ul class="dropdown-menu">').appendTo($li);
                    for(var c=0; c<children.length; c++){
                        addItem($ul, children[c]);
                    }
                }
            }
            $l.appendTo($e);
            return;
        }

        var $l = $('<ul class="dropdown-menu">');
        for(var c=0; c<data.length; c++){
            addItem($l, data[c]);
        }
        $l.appendTo($e);
	}
	$.get('/api/node/id/'+nid+'/children/area?flatten=data[id,name,urlStub,urlAncestorStub,subAreaCount,subType,asciiName]&expires=10',
        function(data){
            menuLoadHandler($li, data);
        });
}

function addMenuHandler($e){
	$e.mouseenter(menuHoverHandler);
}

addMenuHandler( $('#favs li.dropdown-submenu') );
addMenuHandler( $('.secondary-navigation li.dropdown-submenu:not(.group,.selected)') );
addMenuHandler( $('#breadCrumbs li.subareas .seperator') );
addMenuHandler( $('#breadCrumbs .world') );


function helpHoverHandler(e){
	var $e = $(e.currentTarget);
	$e.unbind('mouseenter', helpHoverHandler);
	var $ul = $e.find('.dropdown-menu');
	function helpLoadHandler ($ul, data){
        	data = data[0][0];
        	function addHelpItem(addTo, item, drp){
            		// alert("DEBUG:"+item[0] + ":" + item[1]);
            		var a = $('<a>').attr('href','/article/'+item[0]).text(item[1])
            		var $li = $('<li>').toggleClass('dropdown-submenu',drp).append(a).appendTo(addTo[item[2]]);
			if ( drp )  {
            		  var $dp = $('<ul>').addClass('dropdown-menu').appendTo($li);
			  addTo[item[2]+1] = $dp;
			}
        	}
        	if (data.length == 0) return;
		var addTo = ['',$ul];
        	for(var c=0; c<data.length; c++){
                  var drp = (data[c+1] && data[c][2]<data[c+1][2]);
                  addHelpItem(addTo, data[c], drp);
        	}
	}
	$.get('/api/config/articles?flatten=data[articles[label,name,level]]', function(data){
            helpLoadHandler($ul, data);
        });
}
function addHelpHandler($e){
	$e.mouseenter(helpHoverHandler);
}
addHelpHandler( $('#pt_help') );

function oembed(el) {
  var oembeddone = el.data('oembed-done');
  if ( !oembeddone ) {
    el.data('oembed-done',1);
    var url = el.data('oembed-url');
    var resource = el.html();
    if ( url && resource ) {
      var tag = el.data('provider-tag') || 'unknown';
      var cbk = el.data('callback') || 'callback';
      url = url + '?url=' + encodeURIComponent(resource) + '&format=json&' + cbk + '=?';
      if ( document.location.protocol == 'https:' )  {
        url = url.replace('http:','https:');
      }
      $.getJSON(url,function(data){
        var html = '';
        if ( data.html ) {
          html = '<div class="oembed-container oembed-'+tag+'">'+data.html+'</div>';
          if ( document.location.protocol == 'https:' )  {
            html = html.replace('http:','https:');
          }
        } else if ( data.type && data.type == 'photo' && data.url ) {
          html = '<a href="'+resource+'"><img src="'+data.url+'" title="'+data.title+'"></a>';
        }
        if ( html ) {
          var provider = 
	   ( data.provider_url ? '<a href="'+data.provider_url+'">' : '' ) +
	   ( data.provider_name ? data.provider_name : '' ) +
	   ( data.provider_url ? '</a>' : '' );
          var license = 
	   ( data.license_url ? '<a href="'+data.license_url+'">' : '' ) +
	   ( data.license ? data.license : '' ) +
	   ( data.license_url ? '</a>' : '' );
          var author = 
	   ( data.author_url ? '<a href="'+data.author_url+'">' : '' ) +
	   ( data.author_name ? data.author_name : '' ) +
	   ( data.author_url ? '</a>' : '' );
          html = html + 
           '<div class="oembed-credits">' +
           ( author ? ' by '+author : '' ) +
           ( provider ? ' via '+provider : '' ) +
           ( license ? ' (under license '+license+')' : '' ) +
           '</div>';
          $(html).insertAfter(el);
          el.html('<a href="'+resource+'">'+resource+'</a>');
          var ptag = el.data('provider-tag');
          if ( ptag ) {
            el.addClass("oembed-"+ptag);
          }
        }
      });
    }
  }
}

$(function(){

	$('span.oembed,div.oembed').each(function(){
          oembed($(this));
	});

	// Setup the node markdown accordian
	// if it is big OR if it has the only-mobile
    $('.node-info:not(.only-mobile) .content').each(function(el){
        var $ni = $(this).closest('.node-info');
        if ( $(this).height() > 75 || screen.width < 400){
            $ni.addClass('expandable')
            $ni.append($('<span class="comment-more"><a class="btn btn-mini" href="#">show more</a></span>'));
        }
    });
	$('.node-info.only-mobile .content').each(function(el){
		var $ni = $(this).closest('.node-info');
		$ni.append($('<span class="comment-more"><a class="btn btn-mini" href="#">show more</a></span>'));
	});
		// if big then add class and more button
	$(".comment-more a, .node-info h2").on("click", function(){
		var $ni = $(this).closest('.node-info');
		var open = $ni.hasClass('expandable');
		var off = $ni.find('h2').offset().top - $(window).scrollTop();
		var $c = $ni.find('.content');
		var moreTop = $ni.offset().top + $ni.outerHeight() - $(window).scrollTop();
		$ni.toggleClass("expandable", !open);
		$ni.toggleClass("contractable", open);
		var label =  $ni.find('h2').clone().children('small').remove().end().text().toLocaleLowerCase();
		$ni.find('.comment-more a').text(!open ? 'show more' : 'hide '+label );
		$ni.trigger('section'+(open?'open':'close'));
		// if the h2 wasn't visible scroll up til it is
		if (!open && off < 0){
			var moreTopNow = $ni.offset().top + $ni.outerHeight();
			window.scrollTo(0,moreTopNow - moreTop);
		}
		return false;
	});


	//
	$('.node-listview .area[data-nid]').each(function(i,e){
		var nid = $(e).data('nid');
		var $e = $(e).find('.stats .routes');
		$e.html( '<a href="/routes/at/'+nid+'" title="Search and filter these routes">' + $e.html() + '</a>'  );
		var $e = $(e).find('.stats .ticks');
		$e.html( '<a href="/ascents/at/'+nid+'" title="Search and filter these ascents">' + $e.html() + '</a>'  );
	});


	// track clicks to static pdf's
	$("a[href*='.pdf']").click(function(e){
		ga('send', 'pageview', e.target.href );
	});


	// see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
	if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {

	} else {
	// start non-touch, ie all hover events
		$('.routetable[data-hover!=false] tr, .areatable[data-hover!=false] tr, .secondary-navigation a, .routelist > div, .node-listview .route[data-nid], .node-listview .area[data-nid]').hover(
			function(){
				$('body').trigger('node.over', {id: $(this).closest('[data-nid]').data('nid') });
			},
	   		function(){
				$('body').trigger('node.out',  {id: $(this).closest('[data-nid]').data('nid') });
			}
		);
	}
	// end non-touch events



    $('.showhide').on('touchstart',function(e){
        var topo = $(this).closest('.phototopo').data('phototopo');
        var $i = $(this).find('i')
        var show = $i.hasClass('icon-eye-open');
        if (show){
            topo.hide()
            $i.attr('class', 'icon-eye-close');
        } else {
            topo.show()
            $i.attr('class', 'icon-eye-open');
        }
        e.preventDefault();
		e.stopPropagation();
    });
    $('.showhide').click(function(e){
        return false;
    });
    $('.showhide').hover(function(){
        $(this).closest('.phototopo').data('phototopo').hide()
        $(this).find('i').attr('class', 'icon-eye-close');
    }, function(){
        $(this).closest('.phototopo').data('phototopo').show()
        $(this).find('i').attr('class', 'icon-eye-open');
    });

	if (screen.width > 400){



		setupTooltips();
		setupKeyboard();

		// headling fixed but only for big screens (not iphones etc)
		if ($('#headline:not(.nofix)').length) {
			$('#headline').keepVisible();
		}

	}


	// ALL events that apply to both touch and mouse, eg FastClick events
	$('body').bind('node.select', function(e,data){

		if (window.PhotoTopo){
			PhotoTopo.select(data.id);
		}
		var $check = $('input[type=checkbox][value='+data.id+']');
		if ( $check.length>0 ) {
			$check.attr('checked', true);
		}

		// var $tr = $check.closest('[data-nid]');
		var $tr = $('.node-listview').find('.route[data-nid='+data.id+'],.annotation[data-aid='+data.id+']');
		if ( $tr.length>0 ) {
			$tr.addClass('selected');
			if ( $tr.hasClass('route') ) {
				updateAscentButton();
			}
			if (typeof updateDynamicListViewMenu == 'function') {
				updateDynamicListViewMenu(e,$tr);
			}
		}
	});
	$('body').bind('node.deselect', function(e,data){
		if (window.PhotoTopo){
			PhotoTopo.deselect(data.id);
		}
		var $check = $('input[type=checkbox][value='+data.id+']');
		if ( $check.length>0 ) {
			$check.attr('checked', false);
		}

		// var $tr = $check.closest('[data-nid]');
		var $tr = $('.node-listview').find('.route[data-nid='+data.id+'],.annotation[data-aid='+data.id+']');
		if ( $tr.length>0 ) {
			$tr.removeClass('selected');
			if ( $tr.hasClass('route') ) {
				updateAscentButton();
			}
			if (typeof updateDynamicListViewMenu == 'function') {
				updateDynamicListViewMenu(e,$tr);
			}
		}
	});

	$('body').bind('node.over', function(e,data){
		var id = data.id;
		if (!id){ return; }

		// hover tr's
		$('#n'+id).addClass('hover');
		$('.node-listview .route[data-nid='+id+']').addClass('hover');
		$('.node-listview .area[data-nid='+id+']').addClass('hover');
		$('.secondary-navigation').find('a[data-nid='+id+']').addClass('active');

		// hover topos
		if (window.PhotoTopo){
			PhotoTopo.hover(id);
		}
	});

	$('body').bind('node.out', function(e,data){
		var id = data.id;
		if (!id){ return; }

		// hover tr's
		$('#n'+id).removeClass('hover');
		$('.node-listview .route[data-nid='+id+']').removeClass('hover');
		$('.node-listview .area[data-nid='+id+']').removeClass('hover');
		$('.secondary-navigation').find('a[data-nid='+id+']').removeClass('active');

		// hover topos
		if (window.PhotoTopo){
			PhotoTopo.unhover(id);
		}
	});
	if (window.PhotoTopo && window.defaultSelect){
		PhotoTopo.select(window.defaultSelect);
	}



	// This set the selected class if you come back to the page
	$('.node-listview :checkbox').each(function(){
		var $check = $(this);
		var is = $check.is(':checked');
		var $tr = $check.closest('.route');
		$tr.toggleClass('selected', is);
	});
	function updateAscentButton(){
		var c = $('.route.selected').length;
		var label = c > 1 ? 'Log '+c+' ascents'	:
			c == 0 ? 'Log ascent(s)' :
			'Log ascent';
		$("[name='State:LogAscent']").val(label).toggleClass('action', c > 0);
	}
	$(".node-listview :checkbox").on("click", function(event){
		var $check = $(this);
        // prevent default is too late, it's already checked!
		var is = !$check.is(':checked');
		var $tr = $check.closest('.route');
		event.stopPropagation();
		$('body').trigger(is?'node.deselect':'node.select', {id: $tr.data('nid') });
	});
	// any routes 
	$(".node-listview .route[data-nid]").on("click", function(event){
		if ($(event.target).closest('.actionarea').length) return;
		var $tr = $(this);
		var $check = $tr.find(':checkbox');
		var is = $check.is(':checked');
		$('body').trigger(is?'node.deselect':'node.select', {id: $tr.data('nid') });
	});
	// any annotations 
	$(".node-listview .annotation[data-aid]").on("click", function(event){
		if ($(event.target).closest('.actionarea').length) return;
		var $tr = $(this);
		var is = $tr.hasClass('selected');
		$('body').trigger(is?'node.deselect':'node.select', {id: $tr.data('aid') });
	});
	// links in markdown
	$(".node-listview .tick a").on("click", function(event){
		event.preventDefault();
		event.stopPropagation();
		$(this).closest('.route').find(':checkbox').attr('checked', true);
		$(this).closest('form').find("[name='State:LogAscent']").click();
	});





	var loading = 0; // number of loading calls
	var saving = 0;  // number of saving calls
	var oldSaving = 0;
	var error = 0;   // number of errors
	$('body').bind('crag.save.start', function(){ saving++;  renderLoadSave() });
	$('body').bind('crag.save.stop' , function(){ saving--;  renderLoadSave() });
	$('body').bind('crag.load.start', function(){ loading++; renderLoadSave() });
	$('body').bind('crag.load.stop' , function(){ loading--; renderLoadSave() });

	$('body').bind('crag.edit.start', function(){ addExitWarning() });
	$('body').bind('crag.edit.stop',  function(){ removeExitWarning() });

	function addExitWarning(){
		window.onbeforeunload = function (e) {
			e = e || window.event;
			// For IE and Firefox prior to version 4
			if (e) {
				e.returnValue = 'You have unsaved data';
			}
			// For Safari
			return 'You have unsaved data';
		}
	}
	// if they submit via the main form then turn the warning off
	function removeExitWarning(){
		window.onbeforeunload = function(){};
	}
	function renderLoadSave(){
		// if no elem then make it
		var feedback = $('#feedback');
		if (!feedback.length){
			$('body').append('<div id="feedback" class="alert"></div>');
			feedback = $('#feedback');
		}
		// if saving then save
		if (saving > 0){
			feedback
				.removeClass('alert-success')
				.addClass('waiting')
				.text('Saving')
				.show();
		} else if (oldSaving > 0){
			feedback
				.removeClass('waiting')
				.addClass('alert-success')
				.text('Saved!')
				.show(0)
				.delay(2000)
				.fadeOut(500);
			removeExitWarning();

		} else {

			if (loading > 0){
				feedback
					.removeClass('alert-success')
					.addClass('waiting')
					.text('Loading'+ (Array(loading + 1).join('.')) )
					.delay(700)
					.show(0);
			} else {
				feedback
					.fadeOut(0);
			}

		}
		// if loading then load
		// if none then hide
		oldSaving = saving;
	}

	$("#favorite").unbind('click').bind('click',function(e){
		e.preventDefault();
		var nodeid = $('body').data('nid');
		var acctid = $('body').data('uid');
		var isFav = $('#favorite').hasClass('fav') ? 1 : 0;
		if ( nodeid && acctid ) {
			var f = $('#favorite');
			f.find('i').attr('class','icon-spinner');
			var count = f.next().text()*1;
			if (isFav) count--;
			else count++;
			f.next().text(count);
			updateFavorite(acctid, nodeid, 1 - isFav, function(){
				var f = $('#favorite');
				f.toggleClass('fav',isFav);
				f.find('i').removeClass('icon-spinner').toggleClass('icon-heart',!isFav).toggleClass('icon-heart-empty',!!isFav);
                	});
		} else  {
			alert("Please login or sign up to add fav crags");
		}
	}); 

	//$(".circuit_add").unbind('click').bind('click',function(){
		//var data = getIDsFromAttr($(this),'class',["acctid","cctid","nodeid"]);
		//if ( data.nodeid>0 && data.acctid>0 && data.cctid>0 ) {
		  //addRouteToCircuit(data.acctid,data.cctid,data.nodeid,function(){
                    //location = location;
                  //});
		//} else  {
		  //alert("Please login or sign up to ");
		//}
	//}); 

	$('#content form.trackunsaved').delegate('input, textarea, select', 'change', function(){
		$('body').trigger('crag.edit.start');
	});
	$('#content form.trackunsaved').submit(function(){
		$('body').trigger('crag.edit.stop');
	});



});

/*
 * Data Access Object for nodes
 * Initally just an in memory access and caching layer around the api
 */
DAO = (function(){
	var cache = {};
	return {
		/*
		 * Returns an object OR if not available calls the callback when it is
		 */	
		getNode: function(id, callback){
			if (cache[id]){
				callback(cache[id]);
				return;
			}
			$('body').trigger('crag.load.start');
			$.get('/api/node/id/'+id+'?show=ancestors,children',null,function(data){
				cache[id] = data.data;
				if (data['children']){
					cache[id].children = data['children']; // TODO remove hack
				}
				$('body').trigger('crag.load.stop');
				callback(cache[id]);
				return;
			},'json');
		},
		getNodes: function(ids, callback){
			var ret = [];
			// if all in cache then return it
			var loadIds = [];
			$.each(ids, function(i, id){
				if (cache[id]){
					ret[i] = cache[id];
				} else {
					ret[i] = {loading: true};
					loadIds.push(id);
				}
			});
			if (loadIds.length == 0){
				callback(ret);
				return;
			}
			theCrag('/api/node/ids?show=ancestors,children&id='+loadIds.join(','), function(data){
				$.each(data.data, function(i, node){
					cache[node.id] = node;
				//	if (node['children']){
				//		cache[id].children = node['children']; // TODO remove hack
				//	}
				});
				$.each(ids, function(i, id){
					ret[i] = cache[id];
				});
				callback(ret);
			});

		},
		search: function(search, cfg, callback){
			if (typeof cfg === "function"){
				callback=cfg;
				cfg = {};
			}
			var esctext = encodeURIComponent(search);
			var url = '/api/node' + (cfg.nodeID ? '' : '') + '/search?search=' + esctext + ( cfg.stopifexact ? '&stopifexact='+cfg.stopifexact : '') + ( cfg.oftype ? '&oftype='+cfg.oftype : '');
			theCrag(url,function(data){
			        var ret = [];
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		getAccount: function(id, callback){
			theCrag('/api/climber/id/' + id, function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		mapAccountLabel: function(label, callback){
			theCrag('/api/climber/label/' + encodeURIComponent(label), function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		mapAccountEmail: function(label, callback){
			theCrag('/api/climber/email/' + encodeURIComponent(label), function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		lookupCrag: function(startswith, mode, callback){
			if (typeof mode === "function"){
				callback=mode;
				mode = '';
			}
			theCrag('/api/lookup/crag?page=1&page-size=20&search=' + encodeURIComponent(startswith) + (mode ? '&mode=' + mode : ''), function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		lookupClimber: function(startswith, mode, callback){
			if (typeof mode === "function"){
				callback=mode;
				mode = 'all';
			}
			theCrag('/api/lookup/climber?page=1&page-size=20&search=' + encodeURIComponent(startswith) + (mode ? '&mode=' + mode : ''), function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		forumID: function(nodeid, callback){
			theCrag('/api/node/id/'+nodeid+'/forumid', function(data){
			        var ret = {};
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		},
		accountSearch: function(search, cfg, callback){
			if (typeof cfg === "function"){
				callback=cfg;
				cfg = {};
			}
			var esctext = encodeURIComponent(search);
			var url = '/api/climber/search?search=' + esctext + ( cfg.stopifexact ? '&stopifexact='+cfg.stopifexact : '');
			theCrag(url,function(data){
			        var ret = [];
				if ( data && data.data )   {
					ret = data.data;
				}
				callback(ret);
			});
		}
	}
}());

/*
 * a convenience wrapper around $.ajax
 * theCrag(url,data,success,error)
 */
var theCrag = function(){
	var args = Array.prototype.slice.call(arguments);

	$('body').trigger('crag.load.start');
	var method = args.shift();
	if (!method || method.substr(0,1) == '/'){
		args.unshift(method);
		method = 'GET';
	}
	var url     = args.shift();
	var data    = args.shift();
	if (typeof data === "function"){
		args.unshift(data);
		data = {};
	}
	var success = args.shift();
	var error   = args.shift();

	if (data){
		data = JSON.stringify(data);
	}

	var p = $.ajax({
		processData: false,
		type: method,
		url: url,
		data: data,
		success: success,
		error: error
	});
	p.always(function(){
		$('body').trigger('crag.load.stop');
	});
	return p;
};


/*
    $(function(){$("#tabs").tabs();});
    $(document).ready(function(){
       $(".hideonopen").hide();
    });
*/


// this function is required for message.js and trip.js - at some point it needs proper integration into the DAO
function postAPI(endpoint,json,successfn,failfn)    {
  var matched = endpoint.match(/\?/);
  if ( matched )   {
    endpoint = endpoint + "&cookieAuth=1";
  } else  {
    endpoint = endpoint + "?cookieAuth=1";
  }
  $.ajax({
    type: 'POST',
    url: endpoint,
    data: json,
    dataType: 'json',
    contentType: 'application/json',
    success: successfn,
    error: function(jqXHR,sts,err){
      if ('undefined' === typeof failfn) {
        alert("api post error: " + err + ":" + sts + ":" + jqXHR.responseText);
      } else  {
        failfn(jqXHR,sts,err);
      }
    }
  });
}

function postAPIWithPromise(endpoint,json)    {
  var matched = endpoint.match(/\?/);
  if ( matched )   {
    endpoint = endpoint + "&cookieAuth=1";
  } else  {
    endpoint = endpoint + "?cookieAuth=1";
  }
  return $.ajax({
    type: 'POST',
    url: endpoint,
    data: json,
    dataType: 'json',
    contentType: 'application/json'
  });
}


function getIDsFromAttr(element,attr,tags) {
  var data = {};
  var pat = ''
  for (var i = 0; i < tags.length ; i++) {
    data[tags[i]] = 0;
    pat += '_([0-9]+)';
  }
  var re = new RegExp(pat);
  if ( element.attr(attr) ) {
    var matched = element.attr(attr).match(re);
    if (matched instanceof Array) {
      for (var i = 0; i < tags.length ; i++) {
        data[tags[i]] = matched[i+1];
      }
    }
  }
  return data;
}


function addRouteToCircuit(acctid,cctid,nodeid,fn) {
  url = "/api/circuit/update";
  atom={submittor:acctid,circuit:cctid,routes:[{action:"add",nodeID:nodeid}]};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function starCircuit(acctid,cctid,action,fn) {
  url = "/api/climber/update";
  atom={account:acctid,circuit:[{action:action,id:cctid}]};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function updateFavorite(accid,nodeid,sts,fn) {
  url = "/api/climber/update";
  atom={account:accid,favorite:[{node:nodeid,status:sts}]};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function updateFollowing(accid,id,sts,fn) {
  url = "/api/climber/update";
  atom={account:accid,follow:[{account:id,status:sts}]};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function updateLastFeed(accid,feed,fn) {
  url = "/api/climber/update";
  atom={account:accid,lastFeed:feed};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function updateUserPrefs(accid,key,value,fn) {
  url = "/api/climber/update";
  atom={account:accid,preference:{}};
  atom.preference[key] = value
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function adminUpdateUserMeta(accid,key,value,refArea,fn) {
  url = "/api/climber/update";
  atom={account:accid,adminUpdate:1,refArea:refArea,meta:{}};
  atom.meta[key] = value
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}


function sendIt(msg,fn,failFn) {
 var url = "/api/message/send?markupType=html";
 var data={data:msg};
 var json=JSON.stringify(data);
 postAPI(url,json,fn,failFn);
 return true;
}

$(function(){
	$('.loggedin .unknown').hover(function(){
		var el = $(this);
		var styles = ["Boulder","Trad","Sport","Top rope","DWS","Aid","Via ferrata","Ice","Alpine","Unknown"];
		var uid = $('body').data('uid');
		var nid = el.closest('[data-nid]');
		if (nid.prop("tagName") == "BODY"){ return; }
		nid = nid.data('nid');
		if (nid){
			createDynamicSytleSelection(styles, el, uid, nid, function(source){
				el.html(source.html()).attr('class',source.attr('class'));
			});
		}
	},function(){
		$("#style-dynamic").remove();
	});
});
/*
 * style - array of styles
 * elem  - a jQuery elem that was hovered
 */
function createDynamicSytleSelection(styles,elem,userid,routeid,callback)  {
	$("#style-dynamic").remove();
	var pos = elem.position();
	var html = '<ul id="style-dynamic" class="dropdown-menu" style="margin-top:1px">';
	html += '<li><p><strong>Know this route\'s style?</strong></p></li>';
	for (var i = 0; i < styles.length ; i++) {
		html += '<li style="display:block"><a href="#"><span class="tags ' + styles[i].toLowerCase() + '">' + styles[i] + '</span></a></li>';
	}
	html += '</ul>';
	$(html).hide().appendTo(elem).css({position:'absolute','z-index':1000,top:pos.top+elem.innerHeight()+1,left:pos.left}).show().find("a").bind('click',function(e){
		var source = $(this).find('.tags');
		var style = source.text();
		callback(source);
		$("#style-dynamic").remove();
		updateStyle(userid,routeid,style,function(){});
		e.preventDefault();
		return false;
	});
}


function updateStyle(accid,nodeid,style,fn) {
  url = "/api/route/update";
  atom={submittor:accid,node:nodeid,gearStyle:style};
  data={data:atom};
  json=JSON.stringify(data);
  postAPI(url,json,fn);
}

function thecrag_index_url(data,ctl)   {
  // alert("DEBUG:thecrag_index_url:start");
  ctl = ctl ? ctl : {};
  var type    = ctl.type    ? ctl.type    : (data.type    ? data.type    : 'area');
  var trailer = ctl.trailer ? ctl.trailer : (data.trailer ? data.trailer : ''    );
  var def = ctl['default'] ? ctl['default'] : '';
  var src = '';
  if ( type.match(/^(area|route)$/) )   {
    if ( data.urlStub )   {
      src = '/climbing/' + data.urlStub;
    } else if ( data.urlAncestorStub )   {
      src = '/climbing/' + data.urlAncestorStub + '/' + type + '/' + data.id;
    } else if ( def )   {
      src = def;
    } else {
      src = '/' + type + '/' + data.id;
    }
  }
  if ( trailer )   {
    src += (trailer.match(/^[\/\?]/)? '' : '/') + trailer;
  }
  // alert("DEBUG:thecrag_index_url:"+src);
  return src;
}


function escapeHTML(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
}

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

/*
 * selected bits from https://github.com/h5bp/mobile-boilerplate
 */
(function(document) {
    window.MBP = window.MBP || {};

    MBP.viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]');

    MBP.fixOrient = function(){
        MBP.viewportmeta.content = (Math.abs(window.orientation) == 90 ? "width=device-width,height=device-height" :  "width=device-height,height=device-width") + ",initial-scale=1.0,user-scalable=no,minimum-scale=1,maximum-scale=1";
    }

    MBP.preventZoom = function() {
	if (!!document.querySelectorAll) return;
        var formFields = document.querySelectorAll('input, select, textarea');
        var contentString = 'width=device-width,initial-scale=1,maximum-scale=';
        var i = 0;
        var fieldLength = formFields.length;

        var setViewportOnFocus = function() {
            MBP.viewportmeta.content = contentString + '1';
        };

        var setViewportOnBlur = function() {
            MBP.viewportmeta.content = contentString + '10';
        };

        for (; i < fieldLength; i++) {
            formFields[i].onfocus = setViewportOnFocus;
            formFields[i].onblur = setViewportOnBlur;
        }
    };
    MBP.autogrow = function(element, lh) {
        function handler(e) {
            var newHeight = this.scrollHeight;
            var currentHeight = this.clientHeight;
            if (newHeight > currentHeight) {
                this.style.height = newHeight + 3 * textLineHeight + 'px';
            }
        }

        var setLineHeight = (lh) ? lh : 12;
        var textLineHeight = element.currentStyle ? element.currentStyle.lineHeight : getComputedStyle(element, null).lineHeight;

        textLineHeight = (textLineHeight.indexOf('px') == -1) ? setLineHeight : parseInt(textLineHeight, 10);

        element.style.overflow = 'hidden';
        element.addEventListener ? element.addEventListener('input', handler, false) : element.attachEvent('onpropertychange', handler);
    };

    // If we cache this we don't need to re-calibrate everytime we call
    // the hide url bar
    MBP.BODY_SCROLL_TOP = false;

    // So we don't redefine this function everytime we
    // we call hideUrlBar
    MBP.getScrollTop = function() {
        var win = window;
        var doc = document;

        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    };

    // It should be up to the mobile
    MBP.hideUrlBar = function() {
        var win = window;

        // if there is a hash, or MBP.BODY_SCROLL_TOP hasn't been set yet, wait till that happens
        if (!location.hash && MBP.BODY_SCROLL_TOP !== false) {
            win.scrollTo( 0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1 );
        }
    };

    MBP.hideUrlBarOnLoad = function() {
        var win = window;
        var doc = win.document;
        var bodycheck;

        // If there's a hash, or addEventListener is undefined, stop here
        if ( !location.hash && win.addEventListener ) {

            // scroll to 1
            window.scrollTo( 0, 1 );
            MBP.BODY_SCROLL_TOP = 1;

            // reset to 0 on bodyready, if needed
            bodycheck = setInterval(function() {
                if ( doc.body ) {
                    clearInterval( bodycheck );
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar();
                }
            }, 15 );

            win.addEventListener('load', function() {
                setTimeout(function() {
                    // at load, if user hasn't scrolled more than 20 or so...
                    if (MBP.getScrollTop() < 20) {
                        // reset to hide addr bar at onload
                        MBP.hideUrlBar();
                    }
                }, 0);
            });
        }
    };


})(document);

MBP.preventZoom();
MBP.hideUrlBar();

function FastClick(layer) {
	'use strict';
	var oldOnClick, self = this;


	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	if (!layer || !layer.nodeType) {
		throw new TypeError('Layer must be a document node');
	}

	/** @type function() */
	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

	/** @type function() */
	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

	/** @type function() */
	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

	/** @type function() */
	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

	/** @type function() */
	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Set up event handlers as required
	if (this.deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}
/*
	var node = target;
	do {
		if ((/\bneedsclick\b/).test(node.className)) return true;
	
	}
	while (node = node.parent);
	return false;
*/
	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
	case 'select':
		return true;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	if (this.deviceIsIOS && targetElement.setSelectionRange) {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (this.deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!this.deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	// If the touch has moved, cancel the click tracking
	if (this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		this.cancelNextClick = true;
		return true;
	}

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (this.deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (this.deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (this.deviceIsIOS && !this.deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (this.deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

		// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
		if (FastClick.prototype.deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
				return true;
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
	'use strict';
	return new FastClick(layer);
};


// if (typeof define !== 'undefined' && define.amd) {
// 
// 	// AMD. Register as an anonymous module.
// 	define(function() {
// 		'use strict';
// 		return FastClick;
// 	});
// } else if (typeof module !== 'undefined' && module.exports) {
// 	module.exports = FastClick.attach;
// 	module.exports.FastClick = FastClick;
// } else {
// 	window.FastClick = FastClick;
// }
// 
// FastClick.attach(document.body);
// 
// 


// ******** START GENERAL HELPER FUNCTIONS ********************

function subURLArg(url,lbl,val) {
  var reg = new RegExp('([?])'+lbl+'=[^&]*&?',"g");
  url = url.replace(reg,'$1');
  reg = new RegExp('&'+lbl+'=[^&]*',"g");
  url = url.replace(reg,'');
  url = url.replace(/[?&]+$/,'');
  if (typeof val !== 'undefined' ) {
    if (!url.match(/[?]/)) {
      url += '?';
    }
    if (!url.match(/[?]$/)) {
      url += '&';
    }
    url += lbl + '=' + val;
  }
  return url;
}

// ********   END GENERAL HELPER FUNCTIONS ********************



// ******** START URL REPLACE EMBED ********************
var URLReplace = {

  resolver: {},

  functions: {},

  resolve: function (resolve) {
    // alert("resolve:" + resolve);
    if ( 'undefined' === typeof URLReplace.resolver[resolve] )  {
      URLReplace.resolver[resolve] = $.Deferred();
    }
    URLReplace.resolver[resolve].resolve();
  },

  resolveTrigger: function ($elem,ctl) {
    //alert("resolveTrigger");
    var resolve = $elem.data('replace-resolve');
    if ( resolve && resolve.length ) {
      if ( 'undefined' === typeof URLReplace.resolver[resolve] )  {
        URLReplace.resolver[resolve] = $.Deferred();
      }
      URLReplace.resolver[resolve].done(function () {URLReplace.trigger($elem,ctl);});
    } else {
      URLReplace.trigger($elem,ctl);
    }
  },

  trigger: function ($elem,ctl) {
    //alert("trigger");
    var control = ctl || {};
    var url = $elem.data('replace-url');
    if ( !url || !url.length )  {
      alert("Error: no stream-url defined");
      return false;
    }
    var cont = $elem.data('replace-container');
    if ( !cont || !cont.length )  {
      alert("Error: no replace-container defined");
      return false;
    }
    var $container = $elem.closest(cont);
    var embed = $elem.data('replace-content');
    if ( !embed || !embed.length )  {
      alert("Error: no replace-content defined");
      return false;
    }
    var $embed = $container.find(embed);
    $container.find('.replace-notification').remove();
    $elem.blur()
    if ('undefined' === typeof control.url) {
      control.url = url;
    }
    var mode = $elem.data('replace-mode');
    if ( mode && mode.length )  {
      control.mode = mode;
    } else {
      control.mode = 'append';
    }
    var prepare = $elem.data('replace-prepare');
    if ( prepare && prepare.length && 'undefined' !== typeof URLReplace.functions[prepare] )  {
      control = URLReplace.functions[prepare]($elem,$container,$embed,control);
    }
    var func = $elem.data('replace-function');
    if ( func && func.length && 'undefined' !== typeof URLReplace.functions[func] )  {
      control.embedder = URLReplace.functions[func];
    }
    URLReplace.embed($elem,$container,$embed,control);
  },

  embed: function ($elem,$container,$embed,control) {
    //alert("embed: "+control.url);
    var waiting =  '<div class="waiting" style="height:5em;"></div>';
    var indev = 0;
    if ( indev ) {
      niceurl = control.url
      niceurl = subURLArg(niceurl,'embed','off');
      $('<p class="replace-notification">Embed URL debug, turn off before prod release: <a href="' + niceurl + '">' + niceurl + '</a></p>').insertAfter($elem);
    }
    $elem.before(waiting);
    var jqxhr = $.ajax(control.url)
    .done(function(content) {
      $container.find('.waiting').remove();
      if ('undefined' === typeof control.embedder) {
        if ( control.mode == 'append' )  {
          $embed.append(content);
        } else if ( control.mode == 'replace' )  {
          $embed.html(content);
        }
      } else {
        control.embedder($elem,$container,$embed,control,content);
      }
    })
    .fail(function() {
      $container.find('.waiting').remove();
      var niceurl = subURLArg(control.url,'embed','off');
      $('.stream').append('<p class="replace-notification">Failed to get stream, please refresh the page to see if the problem was temporary or click the direct url <a href="' + niceurl + '">' + niceurl + '</a></p>');
    })
  }

};

(function(){
 $("body").on("click", "[data-replace-url]", function(e){
  //alert("click");
  e.preventDefault();
  var control = {init:0};
  URLReplace.resolveTrigger($(this),control);
 });
 $(".replace-initialise[data-replace-url]").each(function(){
  //alert("init");
  var control = {init:1};
  URLReplace.resolveTrigger($(this),control);
 });
})();

// ********   END URL REPLACE EMBED ********************



// ********   START ROTATE IMAGE ********************

var ImageUploadRotate = {
  anticlockwise_stub: ['filters:rotate(90)/','','filters:rotate(270)/','filters:rotate(180)/'],
  anticlockwise_position: [3,0,1,2],
  clockwise_stub: ['filters:rotate(270)/','filters:rotate(180)/','filters:rotate(90)/',''],
  clockwise_position: [1,2,3,0],
  positions: {},
  init_image: function (id,pos) {
    ImageUploadRotate.positions[id] = pos;
  },
  rotate_anticlockwise: function ($imgcontainer) {
    $('body').trigger('crag.load.start');
    var url = "/api/image/transform";
    var id = $imgcontainer.data('id');
    var atom={group:$imgcontainer.data('group'),id:id,anticlockwise:1};
    var data={data:atom};
    var json=JSON.stringify(data);
    postAPI(url,json,function(){
      var rstub = ImageUploadRotate.anticlockwise_stub[ImageUploadRotate.positions[id]];
      ImageUploadRotate.positions[id] = ImageUploadRotate.anticlockwise_position[ImageUploadRotate.positions[id]];
      var imgurl = $imgcontainer.data('server') + $imgcontainer.data('url-size-stub') + rstub + $imgcontainer.data('url-hash-stub');
      $imgcontainer.html('<img src="' + imgurl + '" />');
      $('body').trigger('crag.load.stop');
    });
  },
  rotate_clockwise: function ($imgcontainer) {
    $('body').trigger('crag.load.start');
    var url = "/api/image/transform";
    var id = $imgcontainer.data('id');
    var atom={group:$imgcontainer.data('group'),id:id,clockwise:1};
    var data={data:atom};
    var json=JSON.stringify(data);
    postAPI(url,json,function(){
      var rstub = ImageUploadRotate.clockwise_stub[ImageUploadRotate.positions[id]];
      ImageUploadRotate.positions[id] = ImageUploadRotate.clockwise_position[ImageUploadRotate.positions[id]];
      var imgurl = $imgcontainer.data('server') + $imgcontainer.data('url-size-stub') + rstub + $imgcontainer.data('url-hash-stub');
      $imgcontainer.html('<img src="' + imgurl + '" />');
      $('body').trigger('crag.load.stop');
    });
  }
};

(function(){
  $(".image-container").each(function(e){
    var pos = 0;
    if ( $(this).data('position') ) {
      pos = $(this).data('position');
    }
    id = $(this).data('id');
    ImageUploadRotate.init_image(id,pos);
  });
  $(".rotate-clockwise").click(function(e){
    var $rot = $(this).parent().find("[data-group]");
    ImageUploadRotate.rotate_clockwise($rot);
  });
  $(".rotate-anticlockwise").click(function(e){
    var $rot = $(this).parent().find("[data-group]");
    ImageUploadRotate.rotate_anticlockwise($rot);
  });
})();

// ********   START ROTATE IMAGE ********************
