$( document ).ready(function() {

    $('.menu-button.list').click(function() {
	$('.listbox').show('fast');
	viewListRefresh();
    });

    // reset the current view
    $('.menu-button.reset').click(function() {
	viewPopulate();
	viewTableHTML();
    });

    $('.menu-button.refresh').click(function() {
	// reload the database, and refresh the current view
	databaseLoad(true,viewGoLoad);
    });

    $('.menu-button.back').click(function() {
	window.location = "..";
    });

    $('.menu-button.cancel').click(function() {
	$('.listbox').hide('fast');
    });

    $('.menu-button.pop-out').click(function() {
	var w = window.open();
	var doc = w.document;
	var headHTML = '<title>' + VIEW_DATA[CURRENT_VIEW.name].name + '</title>';
	headHTML += $('head').html();
	headHTML += '<style>.results-box { top:0px }</style>';
	var bodyHTML = '<div class="results-box">' + $(".results-box").html() + '</div>';

	doc.write('<html>');
	doc.write('<head>' + headHTML + '</head>');
	doc.write('<body>' + bodyHTML + '</body>'); 
	doc.write("</html>");
	doc.close();
    });

    $('.constraint-input.go').click(function() {
	if(!$(this).hasClass('disabled')) {
	    viewGoLoad();
	}
    });

    setTimeout(function() { viewListRefresh(); $('.listbox').show('fast'); }, 500);

    // clear all data upon the first load
    selectorSet('year','');
    selectorSet('robot','');
    selectorSet('competition','');
    selectorSet('match','');
    selectorGoEnable(false);

    databaseInit();

    // handle clicking on multi-select thingies - uses cool jQuery delegate "on" so that
    //  the parent is responsible for executing the lower level - makes it easy
    //  to swap in/out items under the parent.

    $('.constraint-box-multi').on('click','.multi-selection',function(x) {

	if($(this).hasClass("group")) {
	    if($(this).hasClass("selected")) {
		if($(this).hasClass("blue")) {
		    $(this).removeClass("blue");
		    $(this).addClass("red");
		} else {
		    $(this).removeClass("red");
		    $(this).removeClass("selected");
		}
	    } else {
		$(this).addClass("blue");
		$(this).addClass("selected");
	    }
	} else {
	    if($(this).hasClass("selected")) {
		$(this).removeClass("selected");
	    } else {
		$(this).addClass("selected");
	    }
	}

	var level = $(this).data("constraint");
	selectorChangeFN(level);
    });

    // make special styling possible for the "multi" value of the sectors
    //  the goal is to make the --MULTI- small in the list and when it is
    //  selected

    $('.constraint-input > .content').on('click','select',function(e) {
	e.preventDefault();
	var val = $(this).find(':selected').val();
	if(val == -1) {  // indicates the "multi" is selected
	    $(this).addClass("is-multi");
	    $(this).parent().parent().find(".multi-on-button").show();
	    $(this).parent().parent().find(".multi-on-button").click();
	} else {
	    $(this).removeClass("is-multi");
	    $(this).parent().parent().find(".multi-on-button").hide();
	}
    });
    

    // when the multi-button is clicked, then show the multi-select div
    
    $('div.multi-on-button').click(function () {

	$(this).toggleClass("active");

	var name = $(this).data("selector");
	var target = $('.constraint-input-multi-' + name);
	var selector = $('.constraint-input-' + name + " select");
	
	if(target.is(":visible")) {
	    target.slideUp(200);
//	    selector.fadeTo(100,1);
	    selector.prop('disabled',false);
	} else {
	    target.slideDown(200);
//	    selector.fadeTo(100,.2);
	    selector.prop('disabled',true);
	}

    });
    
});
