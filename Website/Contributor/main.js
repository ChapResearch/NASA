//
// Main code for driving the contributor screens.
//  - Allocates the NASA object (see NASA.js)
//  - Paints the general purpose background
//  - calls the construction of the season-specific HTML from the XML
//

var myNASA = new NASA();

function nameChange(name)
{
    console.log("name boink");
    $('div.top-bar .controller-name span').text(name);
}
	

function connectionChange(conn)
{
    var con = $("div.connect-indicator");

    if(conn) {
	con.addClass("connected");
    } else {
	con.removeClass("connected");
	nameChange("");
    }
    
    console.log("boink! " + (conn?"connect":"disconnect"));
}

function settingsForm(onoff)
{
    (function($){
	
	if(onoff) {
	    $('.overlay').show();
	    $('.settings-form').show();
	} else {
	    $('.overlay').hide();
	    $('.settings-form').hide();
	}
    }(jQuery));
}

var timerCurrent = 0;
var timerStart = 0;
var timerInterval = null;

function timerGetMins()
{
    return(Math.floor((timerCurrent-timerStart) / 60));
}

function timerGetSecs()
{
    return(Math.floor((timerCurrent - (timerGetMins() * 60)) - timerStart));
}
    
function timerDisplay()
{
    timerCurrent = Math.floor(Date.now()/1000);
    
    var minutes = timerGetMins();
    var seconds = timerGetSecs();

    var minString = minutes.toString();
    var secString = seconds.toString();

    if(seconds < 10) {
	secString = "0" + secString;
    }

    display.setValue(minString + ":" + secString);
}

//
// connectBox() - turn the connetion dialogbox on/off (true/false)
//
function connectBox(onoff)
{
    (function($){
	
	if(onoff) {
	    connectBoxReset();        // always resets when showing
	    $('.overlay').show();
	    $('.connecting-dialog').show();
	} else {
	    $('.overlay').hide();
	    $('.connecting-dialog').hide();
	}
    }(jQuery));
}

//
// connectBoxReset() - resets the connection box to its initial (no text) state.
//
function connectBoxReset()
{
    (function($){

	var box = $('.connecting-dialog');

	box.hide();

	box.find('.contacting-controller').hide();
	box.find('.contacting-controller .done').hide();
	box.find('.contacting-controller .fail').hide();

	box.find('.checking-password').hide();
	box.find('.checking-password .done').hide();
	box.find('.checking-password .fail').hide();

	box.find('.getting-name').hide();
	box.find('.getting-name .done').hide();
	box.find('.getting-name .fail').hide();

	box.find('.checking-slot').hide();
	box.find('.checking-slot .done').hide();
	box.find('.checking-slot .fail').hide();

    	box.find('.failed').hide();
	box.find('.connected').hide();
	
	box.find('button').hide();
	
}(jQuery));
}


//
// connectBoxStatusReport() - used as a callback for the NASA connection routine
//                            to report on status.
//
function connectBoxStatusReport(status)
{
    var box = $('.connecting-dialog');
    
    switch(status) {

    case 'contact':       box.find('.contacting-controller').show(); return;
    case 'contact-done':  box.find('.contacting-controller .done').show(); return;
    case 'contact-fail':  box.find('.contacting-controller .fail').show();
	                  box.find('.failed').show();
	                  box.find('button').show();
	                  return;
	
    case 'name':          box.find('.getting-name').show(); return;
    case 'name-done':     box.find('.getting-name .done').show(); return;
    case 'name-fail':     box.find('.getting-name .fail').show();
	                  box.find('.failed').show();
	                  box.find('button').show();
	                  return;

    case 'password':      box.find('.checking-password').show(); return;
    case 'password-done': box.find('.checking-password .done').show(); return;
    case 'password-fail': box.find('.checking-password .fail').show();
	                  box.find('.failed').show();
	                  box.find('button').show();
	                  return;

    case 'slot':          box.find('.checking-slot').show(); return;
    case 'slot-done':     box.find('.checking-slot .done').show();
  	                  box.find('.connected').show();
	                  setTimeout(function(){connectBox(false);},1000);
	                  return;
    case 'slot-fail':     box.find('.checking-slot .fail').show();
	                  box.find('.failed').show();
	                  box.find('button').show();
	                  return;
    }
}

function about()
{
    (function($) {
	$('div.about').fadeIn(100);
	$('div.about .birdy').fadeIn(500);
	
	setTimeout(function() { $('div.about').fadeOut(1000,function() { settingsForm(true);});},1000);

    }(jQuery));
}

function timerClear()
{
    timerStart = Math.floor(Date.now()/1000);
    timerDisplay();
}

//
// KEYPAD!
//
//   The keypad is used to input the team number. The numbers and
//   controls have click handlers that point to routines below.
//
function keypadNumber(number)
{
    var keypadNumberObj = $('div.keypad div.display input');
    var prevNumber = keypadNumberObj.val();

    var newNumber;
    
    if(prevNumber.length < 5) {
	newNumber = prevNumber + number;
    }

    keypadNumberObj.val(newNumber);
}

function keypadControl(control)
{
    var keypadNumberObj = $('div.keypad div.display input');
    var prevNumber = keypadNumberObj.val();

    var newNumber;
    
    switch(control) {

    case 'DEL':
	if(prevNumber == "") {
	    newNumber = prevNumber;
	} else {
	    newNumber = prevNumber.substring(0,prevNumber.length-1);
	}
	break;

    case 'CE':
	newNumber = "";
	break;

    case 'ENTER':
	$('div.keypad').hide();
	$('div.overlay').hide();
	$('div.team-number').text(prevNumber);
	myNASA.setTeam(prevNumber);
	break;
    }

    keypadNumberObj.val(newNumber);
}

// must run the XML code after resources have been loaded to get the seasonXML object loaded

$( window ).on( "load", function() { 

    var xmldata = document.getElementById("seasonXML").contentDocument;

    var jObject = $("app",xmldata);      // the jQuery'able xml data
    var target = $("div.content");       // the place where all new fields should be written

    // uncomment this code for a little test of the load
    //    console.log(xmldata);
    //    jObject.find("layout field").each(function() { console.log($(this).find('name').text()); });

    var output = seasonLoad_generateHTML(jObject)

    target.append(output);
});

$( document ).ready(function() {

    myNASA.slot = $('div.contributor .letter.selected').data('contributor');
    
    console.log(myNASA);

    // set-up for the about page, that terminates in bringing up the settingsForm
    about();
    
    // clear the timer
    timerClear();

    // set up monitoring of connection changes
    myNASA.connectionMonitor(connectionChange);
    myNASA.nameMonitor(nameChange);
    
    $('div.connect-indicator').click(function() {
	console.log("clicky clicky");
	if(myNASA.connected) {
	    myNASA.disconnect();
	} else {
	    connectBox(true);
	    myNASA.connect(connectBoxStatusReport);
	}
    });

    $('div.contributor .letter').click(function() {
	if(myNASA.connected) {
	    alert("You can't change contributor while connected!");
	} else {
	    if(!$(this).hasClass("selected")) {
		$('div.contributor .letter').removeClass("selected");
		$(this).addClass("selected");
		myNASA.slot = $(this).data('contributor');
		console.log(myNASA);
	    }
	}
    });

    $('div.myname-name, div.myname-prompt').click(function() {
	settingsForm(true);
    });

    $('div.connecting-dialog button').click(function() {
	connectBox(false);
    });

    $('div.settings-form button').click(function() {
	myNASA.setName($('div.settings-form .myname-input input').val());
	myNASA.setPassword($('div.settings-form .password-input input').val());

	$('div.myname-name span').text(myNASA.getName());
	settingsForm(false);
    });

    $('button.start').click(function() {
	timerStart = Math.floor(Date.now()/1000);
	timerCurrent = timerStart;
	timerDisplay();
	$(this).prop('disabled',true);
	$('button.send').prop('disabled',true);
	$('button.stop').prop('disabled',false);
	timerInterval = setInterval(timerDisplay,1000);
    });

    $('button.stop').click(function() {
	clearInterval(timerInterval);
	timerDisplay();
	$(this).prop('disabled',true);
	$('button.send').prop('disabled',false);
	$('button.start').prop('disabled',false);
    });

    $('div.team-color').click(function() {
	if($(this).hasClass('blue')){
	    $(this).removeClass('blue');
	    $(this).addClass('none');
	    myNASA.setColor(null);
	} else if($(this).hasClass('none')) {
	    $(this).removeClass('none');
	    $(this).addClass('red');
	    myNASA.setColor('red');
	} else {
	    $(this).removeClass('red');
	    $(this).addClass('blue');
	    myNASA.setColor('blue');
	}
    });

    var numpadOptions = {
	hideDecimalButton: true,
	hidePlusMinusButton: true,
    };

    $('div.keypad div.number').click(function() {
	if(!$(this).hasClass('blank')) {
	    keypadNumber($(this).text());
	}
    });

    $('div.keypad div.control').click(function() {
	if(!$(this).hasClass('blank')) {
	    keypadControl($(this).text());
	}
    });

    $('div.keypad input').keypress(function(event) {
	console.log(event);
	if(event.which == 13) {
	    keypadControl("ENTER");
	}
	if(event.which < 48 || event.which > 57) {
	    event.preventDefault();
	    return;
	}
    });
	

    $('div.bottom-bar .team-number').click(function() {
	$('div.overlay').show();
	$('div.keypad').show();
	$('div.keypad input').focus();
	$('div.keypad div.display input').val($('div.bottom-bar .team-number').text());
    });
    
    $('div.settings-form input').keypress(function(event) {
	// Allow controls such as backspace, tab etc.
	var arr = [8,9,16,17,20,45];

	// Upper case
	for(var i = 65; i <= 90; i++){
	    arr.push(i);
	}

	// lower case
	for(var i = 97; i <= 122; i++){
	    arr.push(i);
	}

	// numbers
	for(var i = 48; i <= 57; i++){
	    arr.push(i);
	}

	// Prevent default if not in array
	if(jQuery.inArray(event.which, arr) === -1){
	    event.preventDefault();
	}

	// check for the enter key
	if(event.which == 13) {
	    var next = $(this).parent().next();
	    if(next.is('button')) {
		next.trigger('click');
	    } else {
		next.find('input').focus();
	    }
	}
		
    });
});
