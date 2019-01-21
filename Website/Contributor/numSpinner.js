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

//
// numSpinner_init() - paints the HTML components for the numSpinner.
//                     The numSpinner is always attached to a regular
//                     <input type="number"> so that jQuery reference
//                     must be passed in. It's position, width, height
//                     is assumed to be configured already.
//
function numSpinner_init(target)
{
    // turn off the display of the target itself

    target.hide();

    // now add the appropraite html to target's parent

    target.parent().append('<br><div class="numSpinner_minus numSpinner_field">&ndash;</div><div class="numSpinner_value numSpinner_field">0</div><div class="numSpinner_plus numSpinner_field">+</div>');
}

function numSpinner_initAll()
{
    $('input[type="number"]').each(function() {
	var target = $(this);                    // this is the associated <input> field
	var value = parseInt(target.val());
	var parent = target.parent();

	numSpinner_init(target);

	var spinnerValue = parent.find('.numSpinner_value');
	var spinnerPlus =  parent.find('.numSpinner_plus');
	var spinnerMinus =  parent.find('.numSpinner_minus');

	spinnerValue.html(value);

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
	    console.log("max " + max);
	    value += 1;
	    if(max === undefined || value <= parseInt(max)) {
		spinnerValue.html(value);
		target.val(value);
	    }
	});

    });
}

	
