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
	alert("refresh");
    });

    $('.menu-button.back').click(function() {
	window.location = "..";
    });

    $('.menu-button.cancel').click(function() {
	$('.listbox').hide('fast');
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

    // handle clicking on multi-select thingies - uses cool jQuery "on" so that
    //  the parent is responsible for executing the lower level - makes it easy
    //  to swap in/out items under the parent.

    $('.constraint-box-multi').on('click','.multi-selection',function(x) {
	console.log("clicky");
	if($(this).hasClass("selected")) {
	    $(this).removeClass("selected");
	} else {
	    $(this).addClass("selected");
	}
	selectorGoEnable(checkConstraints());	
    });

    $('div.multi-on').click(function () {
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
