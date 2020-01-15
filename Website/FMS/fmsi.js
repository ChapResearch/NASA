//
// FMS Interface
//
//   This module interfaces to the FIRST FMS events system. It allows
//   the Statistics to show things such as "match outcome predictor.
//

var token = 'D2FF964A-445B-4687-8F83-0D62D8528DEC';
var userName = 'erothfus';

//
// NOTE - the code depends upon these URLs ending in '/'
//
var testServer = 'https://frc-staging-api.firstinspires.org/v2.0/';
var realServer = 'https://frc-api.firstinspires.org/v2.0/';

var fmsi_Server = 'http://cors.io/?' + realServer;

//
// fmsi_Events() - returns a list of events for a particular year from the FMS
//                 system.
//
function fmsi_Events(year)
{
    
}

//
// fmsi_URL() - given a particular API, return the URL that represents the API.
//              Normally, you will specify the 'year' since all API calls need it.
//              The URL returned will always end in a '/'.
//
function fmsi_URL(year)
{
    var retURL = fmsi_Server;
    
    if(year) {
	retURL += year + "/";
    }

    return(retURL);
}

//
// fmsi_Matches() - returns the list of matches for the given event. If type is
//                  given, it must be either "qual" or "playoff" - "qual" by default.
//
function fmsi_Matches(year,event,type)
{
    if(!type) {
	type = 'qual';
    }

    var url = fmsi_URL(year) + 'schedule/' + event + '?tournamentLevel=' + type;

    console.log("trying...");
    
    $.ajax
    ({
	type: "GET",
	url: url,
	dataType: 'json',
	headers: {
	    "Authorization": "Basic " + btoa(userName + ":" + token)
	},
	data: {},
	success: function (){
	    alert('Thanks for your comment!'); 
	}
    });
}

function fmsi_Test()
{
    alert("OK - running");
    fmsi_Matches(2019,'GALILEO','qual');
}

$( document ).ready(function() {
    fmsi_Test();
});
