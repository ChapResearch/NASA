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

function matchChange(match)
{
    $('div.top-bar .match-name span').text(match);
}

//
// resetChange() - this is occuring during a BLE conversation - so it shouldn't
//                 cause a transmit!
//
function resetChange()
{
    console.log("resetChange()");
    
    keypadReset();       // clear robot number
    teamColorReset();    // clear the color

    var xmldata = document.getElementById("seasonXML").contentDocument;
    var jObject = $("app",xmldata);      // the jQuery'able xml data

    reset(jObject);

    imageMap_reset();
    
    timerStop();
    timerClear();

    // if testing, generate a new match number
    if(testAttributes.testing) {
	matchChange(Math.ceil(Math.random()*199));
    }
}

// dataIncoming() - incoming data from the controller!  It will be pushed into
//                the data form.  Note that this routine is passed the data
//                that comes from the BLE notification in JSON format.  It can
//                handle two things:  simple attr/value or array of attr/value.
//
//                There are two special attributes that can come in: teamNumber
//                and teamColor. The need to be set but ALSO returned back to
//                the controller in the "normal" way.  But this has to be staged
//                appropriately so that two BLE requests can't be in flight at
//                once. It would NICE if the BLE machinery would handle this.
//                Maybe next time.
//
function dataIncoming(data)
{
    try {
	console.log("got incoming data:",data);

	// at this point, need to catch the TOP fields: teamColor, teamNumber
	//   and process them locally, everything else is handed to the season
	//   machinery to handle
	//   (note that currently "match" isn't in the top data, though it logically
        //      should/could be)

	var teamNumber = null;
	var teamColor = null;

	if(data.hasOwnProperty('teamNumber')) {
	    teamNumber = data.teamNumber;
	}
	if(data.hasOwnProperty('teamColor')) {
	    teamColor = data.teamColor;
	}

	if(teamNumber || teamColor) {
	    myNASA.setTeamAndOrColor(teamNumber,teamColor,colorPickerEnable);
	}

	for(var prop in data) {
	    switch(prop) {
	    case 'teamNumber':
		$('div.team-number').text(data[prop]);
		break;
	    case 'teamColor':
		$('div.team-color').removeClass('red blue none').addClass(data[prop]);
		break;
	    default:
		seasonSetValue(prop,data[prop]);
		break;
	    }
	}
    } catch(error) {
	console.log("Error parsing incoming JSON from controller");
	console.log(error);
    }
}

function connectionChange(conn)
{
    var con = $("div.connect-indicator");

    if(conn) {
	con.addClass("connected");
	$('button.send').prop('disabled',false);	
    } else {
	con.removeClass("connected");
	$('button.send').prop('disabled',true);	
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

var timerCurrentTime = 0;
var timerStartTime = 0;
var timerInterval = null;

function timerGetMins()
{
    return(Math.floor((timerCurrentTime-timerStartTime) / 60));
}

function timerGetSecs()
{
    return(Math.floor((timerCurrentTime - (timerGetMins() * 60)) - timerStartTime));
}

//
// timerTick() - this is the function that is called once a second to update
//               the timer.  It is called on an setInterval() every second.
//               This routine automatically stops the clock after a set time.
//
function timerTick()
{
    timerDisplay();
    
    if(timerGetMins() == 5) {     // protective hard-coded stop just in case
	timerStop();
    }
}

    
function timerDisplay()
{
    timerCurrentTime = Math.floor(Date.now()/1000);
    
    var minutes = timerGetMins();
    var seconds = timerGetSecs();

    var minString = minutes.toString();
    var secString = seconds.toString();

    if(seconds < 10) {
	secString = "0" + secString;
    }

    display.setValue(minString + ":" + secString);
}

function timerStart()
{
    timerStartTime = Math.floor(Date.now()/1000);
    timerCurrentTime = timerStartTime;
    timerDisplay();

    $('button.reset').prop('disabled',true);
    $('button.start').prop('disabled',true);
    $('button.send').prop('disabled',true);
    $('button.stop').prop('disabled',false);

    if(timerInterval !== null) {
	clearInterval(timerInterval);
    }
    timerInterval = setInterval(timerTick,1000);
}

function timerStop()
{
    clearInterval(timerInterval);
    timerInterval = null;
    timerDisplay();
    $('button.reset').prop('disabled',false);
    $('button.start').prop('disabled',false);
    $('button.send').prop('disabled',false);
    $('button.stop').prop('disabled',true);
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

    default:              box.find('.failed').show();
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
    timerStartTime = Math.floor(Date.now()/1000);
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

//
// keypadReset() - reset the number on the keypad
//
function keypadReset()
{
    $('div.team-number').text("");
    $('div.keypad div.display input').val("");
}

//
// teamColorReset() - sets the team color to "no color"
//
function teamColorReset()
{
    var target = $('div.team-color');

    target.removeClass('red');
    target.removeClass('blue');
    target.addClass('none');
}

//
// teamColorGet() - gets a representation of the team color for sending to the DB.
//
function teamColorGet()
{
    var target = $('div.team-color');

    if(target.hasClass('blue')) {
	return('blue');
    } else if(target.hasClass('red')) {
	return('red');
    } else {
	return('none');
    }
}

//
// teamNumberGet() - gets the team number for sending to the DB. NOTE that this number
//                   is redundant in this data. The Controller sends the number itself.
//
function teamNumberGet()
{
    return($('div.team-number').text());
}

//
// dataSend() - gathers the data from the season form, and sends it off to the controller.
//
function dataSend()
{
    var xmldata = document.getElementById("seasonXML").contentDocument;
    var jObject = $("app",xmldata);      // the jQuery'able xml data

    if(checkRequiredFields(jObject))
    {
	var data = seasonDataGather(jObject);

	data.teamColor = teamColorGet();
	data.teamNumber = teamNumberGet();
	data.userName = $('div.myname-name span').text();
	
	imageMap_gather(data);     // data is augmented by the imageMaps' data

	console.log(data);

	if(testAttributes.testing) {

	    if(data.teamNumber == "") {
		alert('Test Mode requires teamNumber to be entered! Data not sent.');
	    } else {
		// the data must be configured for the catcher
		var catcherData = {};
		catcherData.match = $('div.top-bar .match-name span').text();;
		catcherData.competition = testAttributes.competition;
		catcherData.team_number = data.teamNumber;
		catcherData.year = testAttributes.year;
		catcherData.record = data;
	    
		myNASA.testSendData(catcherData,function(disable) { jQuery('button.send').prop('disabled',disable);});
	    }
	} else {
	    myNASA.sendData(data,function(disable) { jQuery('button.send').prop('disabled',disable);});
	}
    }
    else
    {
	console.log("Must enter in data for required fields");
    }
}

//
// checkRequiredFields() - Checks if all the layout fields tagged with <optional> have had data enetered into them
//                         WARNING: right now this only works for checkboxes and radios, if the type of input is not
//                                  one of those the <default> tag does nothing
//
function checkRequiredFields(seasonXML)
{
    console.log("We are in checkRequiredFields");
    var errorMessage = "Cannot Send till the following required fields are filled out: ";

    // If we find that all requried fields are filled out this will stay the same, and change otherwise
    var canSend = true;
    
    seasonXML.find("layout field").each(function()
					{
					    //grab the name of this field which will be used to find many things includingg the element field
					    var name = $(this).find('name').text();
					    if($(this).find('type').text() == "radio" || $(this).find('type').text() == "checkbox"){
						var optional = $(this).find('optional');
						console.log("This is a radio or checkbox");
						if(optional.length > 0 && optional.text() == "false")
						{
						    console.log("Optional exists and is false");
						    console.log(name)
						    var field = $(".content").find('[name = "' + name + '"]:checked');
						    console.log(field.length);
						    if(field.length < 1){
							canSend = false;
							// now we add the label from the xml for this field (plus a ,)
							errorMessage += name + ", ";
						    }
						}
					    }
					    console.log("");
					})

    // if canSend is still true then we just return, otherwise we need to print out the error message for the user
    if(canSend)
	return true;
    else
    {
	window.alert(errorMessage);
	return false;
    }

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

    resetChange();
    numSpinner_initAll();
    imageMap_initAll();
});

//
// colorPickerEnable(),colorPickerDisable() - used to enable/disable the color picker.
//
function colorPickerEnable()
{
    console.log("enable color picker");
    $('div.team-color').removeClass('disabled');
}

function colorPickerDisable()
{
    $('div.team-color').addClass('disabled');
}

//
// TEST MODE
//
//    If the query parameter "test" is given on the URL, then we enter test
//    mode.  In this mode, the catcher is called directly from the contributor
//    so that you don't have to have a controller.  The query parameters that
//    MUST also be specified are:
//
//       competition - really any name at all
//       year - this MUST be > 3000 and < 4000 - kinda' a test range
//
//    Unlike when using the controller, the following attributes are supplied
//    by the contributor:
//
//       teamNumber - normally sent by the controller (MUST be specified)
//       teamColor - also normally sent by the controller (optional)
//
//    And the following attribute is added, and really should be added to the
//    data sent by the controller:
//
//       userName - set to the name of the user (optional)
//
var testAttributes = {};
testAttributes.testing = false;

//
// checkTestAttributes() - looks into the query parameters to see if testing
//                         has been set-up.  Will set testAttributes.testing = true
//                         ONLY if a useful set of test attributes has been
//                         specified.  Will emit console logs if things appear
//                         to be amiss.
//
function checkTestAttributes()
{
    var error = false;
    
    var urlParams = new URLSearchParams(window.location.search);

    if(urlParams.has('test')) {

	if(!urlParams.has('year')) {
	    console.log('TEST MODE: "year" must be specified for testing (3000 <= year < 4000)');
	    error = true;
	}
	
	if(!urlParams.has('competition')) {
	    console.log('TEST MODE: "competition" must be specified for testing');
	    error = true;
	}

	if(!error) {
	    testAttributes.competition = urlParams.get('competition');
	    testAttributes.year = urlParams.get('year');

	    if(testAttributes.year < 3000 || testAttributes.year > 3999) {
		console.log('TEST MODE: year is out of bounds (' + testAttributes.year + ')');
		error = true;
	    }

	    if(!error) {
		testAttributes.testing = true;
		console.log('TEST MODE: enabled (' + testAttributes.year + ',' + testAttributes.competition + ')');
	    }
	}
    }
}


$( document ).ready(function() {

    myNASA.slot = $('div.contributor .letter.selected').data('contributor');
    
    console.log(myNASA);

    checkTestAttributes();

    if(testAttributes.testing) {
	nameChange("test mode");
	matchChange(Math.ceil(Math.random()*199));
    }

    // set-up for the about page, that terminates in bringing up the settingsForm
    about();
    
    // clear the timer
    timerClear();

    // set up monitoring of connection/name changes - note that the name change probably
    //   only gets called once upon the connection
    
    myNASA.connectionMonitor(connectionChange);
    myNASA.nameMonitor(nameChange);
    myNASA.matchMonitor(matchChange);
    myNASA.resetMonitor(resetChange);
    myNASA.startMonitor(function(start) { if(start) {timerStart();} else { timerStop(); } });
    myNASA.dataMonitor(dataIncoming);
    
    $('div.connect-indicator').click(function() {
	if(myNASA.connected) {
	    myNASA.disconnect();
	} else {
	    if($('div.myname-name span').text() == "") {
		alert("You must enter a NAME before connecting. Click on \"My Name\" at the top of the screen.");
	    } else {
		connectBox(true);
		myNASA.connect(connectBoxStatusReport);
	    }
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
	myNASA.setUserName($('div.settings-form .myname-input input').val());
	myNASA.setPassword($('div.settings-form .password-input input').val());

	$('div.myname-name span').text(myNASA.getUserName());

	if(myNASA.connected) {
	    myNASA.sendUserName();
	}
	
	settingsForm(false);
    });

    $('button.start').click(function() {
	timerStart();
    });

    $('button.stop').click(function() {
	timerStop();
    });

    $('button.send').click(function() {
	if($('div.myname-name span').text() == "") {
	    alert("You must enter a NAME before sending data. Click on \"My Name\" at the top of the screen.");
	} else {
	    dataSend();
	}
    });

    $('button.reset').click(function() {
	resetChange();
    });
    
    $('div.team-color').click(function() {

	var target = $(this);

	if(!target.hasClass('disabled')) {
	    colorPickerDisable();                  // always disable immediately
	    if(target.hasClass('blue')){
		target.removeClass('blue');
		target.addClass('none');
		myNASA.setColor('none',colorPickerEnable);
	    } else if(target.hasClass('none')) {
		target.removeClass('none');
		target.addClass('red');
		myNASA.setColor('red',colorPickerEnable);
	    } else {
		target.removeClass('red');
		target.addClass('blue');
		myNASA.setColor('blue',colorPickerEnable);
	    }
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
