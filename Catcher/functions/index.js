
const functions = require('firebase-functions');
var firebase = require("firebase");

const local = require('./firebaseInit');

exports.catcher = functions.https.onRequest((request, response) => {
    
    console.log('Hello! From Catcher');

    local.firebaseInit(firebase);
    
    let data = request.body;
    var year = data.year;
    var team_number = data.team_number;
    var competition = data.competition;
    var match = data.match;
    var record = data.record;
    
    console.log(data);

    if (!year || !team_number || !competition || !match || !record) {
	response.send("0");
    } else {

	var refpath = year + "/" + team_number + "/" + competition + "/" + match;
	var database = firebase.database();
	var ref = database.ref(refpath);

	// add the timestamp when the record was added
	
	record.date = firebase.database.ServerValue.TIMESTAMP;

	//	 ref.on('value', function(snapshot) {
	// console.log(snapshot.val());
	//  });
	
	ref.set(record);

	response.send("1");
	
    }

});

