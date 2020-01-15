var FIREBASE_DATA = null;

//
// All metadata (except at the match level) are within this object, so
//  it is normally filtered out.
//
var METADATA = "_metaData";

//
// databaseInit()- initialize firebase for retrieval
//
function databaseInit()
{
	var config = {
	    apiKey: "AIzaSyAJtiy-xB69zjg7VRdBiEDmtupBeoGgS9A",
	    authDomain: "nasa-7a363.firebaseapp.com",
	    databaseURL: "https://nasa-7a363.firebaseio.com",
	    projectId: "nasa-7a363",
	    storageBucket: "nasa-7a363.appspot.com",
	    messagingSenderId: "885889218553"
	};

    firebase.initializeApp(config);
    
}

//
// databaseLoad() - OK, yikes, this routine downloads the entire database.
//                  For now (and the foreseeable future) this is fine.
//                  It will need to be rethought eventually.
//
function databaseLoad(reload,callback)
{
    if(reload || FIREBASE_DATA === null) {
	firebase.database().ref('/2019').once('value')
	    .then((data) => {
		FIREBASE_DATA = data;
		callback(FIREBASE_DATA);
	    });
    } else {
	callback(FIREBASE_DATA);
    }
}

function modifyRecords(targetCompetition,changeName,callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var output = "";
		     var data = snapshot.val();
		     for(var robot in data) {
			 if(robot != METADATA) {
			     for(var competition in data[robot]) {
				 if(competition == targetCompetition) {
				     // NOTE - this should be in an update() or transaction
				     snapshot.ref.child(robot).child(changeName).set(data[robot][competition]);
				     snapshot.ref.child(robot).child(competition).remove();
				     output += "" + robot + " " + competition + '<br>';
				 }
			     }
			 }
		     }
		     callback(output);
		 });

}

//
// replaceDate() - this routine was created because the new non-catcher approach didn't
//                 add the date to records. Now it does ** Thu Apr 18 11:51:42 2019 **
//                 but there are early morning records that don't have dates. So this
//                 routine will take the "updated" date and copy it to date.

function replaceDate(targetComp,callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var output = "";
		     var data = snapshot.val();
		     for(var robot in data) {
			 if(robot != METADATA) {
			     for(var competition in data[robot]) {
				 if(competition == targetComp) {
				     for(var match in data[robot][targetComp]) {
					 if(match != METADATA) {
					     var gotDate = false;
					     var gotUpdated = false;
					     if(data[robot][competition][match].hasOwnProperty("date")) {
						 gotDate = true;
					     }
					     if(data[robot][competition][match].hasOwnProperty("updated")) {
						 gotUpdated = true;
					     }
					     output += robot + ":" + competition + ":" + match + ":";
					     if(gotDate) {
						 output += "Got DATE! " + data[robot][competition][match].date;
					     } else {
						 output += "no date";
						 if(gotUpdated) {
						     output += " - fixing to " + data[robot][competition][match].updated;
						     var newDate = data[robot][competition][match].updated;
						     snapshot.ref.child(robot).child(competition).child(match).child("date").set(newDate);
						 } else {
						     output += " - can't fix";
						 }
					     }
					     output += "<br>";
					 }
				     }
				 }
			     }
			 }
		     }
		     callback(output);
		 });
}    

function firstTest()
{
    //    modifyRecords("Greenvile","Greenville",(html) => $('body').append(html));

    replaceDate("GALILEO",(html) => $('body').append(html));
    
    alert("Kicked Off Fetch - it may take some time...");
}

$( document ).ready(function() {
    databaseInit();
    firstTest();
});
