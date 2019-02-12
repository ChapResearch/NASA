//
// numSpinner.js
//
//    Creates a easy-to-use (on a tablet) number up/down spinner. The word
//    word "spinner" is a bit weird for a tablet, though.
//
//    The general concept is:
//
//    ,-----,------------,-----,
//    |     |            |     |
//    |  -  |     0      |  +  |
//    |     |            |     |
//    '-----'------------'-----'
//
//    Where the +/- buttons are pretty big, so they're easy to touch.
//
//    To make this work, hacked, this control "replaces" the input,
//    but keeps the input's value up-to-date so that querying its value
//    works as expected.
//
//    The orginal number value can be changed, too, but the jQuery
//    trigger('change') must be called so that this simulation can wake-up
//    to the change.

function numSpinner_initAll()
{

    // first, add the simulation
    
    $('input[type="number"]').each(function() {
	var target = $(this);                    // this is the associated <input> field
	var parent = target.parent();

	target.hide();                    // hide the number field itself

	target.parent().append('<div class="numSpinner_minus numSpinner_field">&ndash;</div>');
	target.parent().append('<div class="numSpinner_value numSpinner_field">0</div>');
	target.parent().append('<div class="numSpinner_plus numSpinner_field">+</div>');
    });

    // then add the clicks on the simulated buttons
    
    $('input[type="number"]').parent().each(function() {
	var parent = $(this);
	var target = parent.find('input');

	var spinnerValue = parent.find('.numSpinner_value');
	var spinnerPlus =  parent.find('.numSpinner_plus');
	var spinnerMinus =  parent.find('.numSpinner_minus');

	spinnerValue.html(parseInt(target.val()));	// set the initial value for the spinner

	spinnerMinus.click(function() {
	    var value = parseInt(spinnerValue.html());
	    var min = target.attr("min");
	    value -= 1;
	    if(min === undefined || value >= parseInt(min)) {
		spinnerValue.html(value);
		target.val(value);
	    }
	});

	spinnerPlus.click(function() {
	    var value = parseInt(spinnerValue.html());
	    var max = target.attr("max");
	    value += 1;
	    if(max === undefined || value <= parseInt(max)) {
		spinnerValue.html(value);
		target.val(value);
	    }
	});
    });

    // finally, monitor the hidden field for value changes, which can only be made by
    //  javascript, so the jQuery.trigger('change') must be called when changing the value

    // this is done in a zero setTimeout() so that it occurs in the next UI loop so that
    //  jQuery can catch-up with the changes to DOM that occurred with the overlay of
    //  the number spinners.
    
    setTimeout(function() {
	$('input[type="number"]').change(function() {
	    var target = $(this);
	    var parent = target.parent();
	    var spinnerValue = parent.find('.numSpinner_value');
	    spinnerValue.html(target.val());
	});
    },0);
}

	
