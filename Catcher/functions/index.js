
const functions = require('firebase-functions');
var firebase = require("firebase");

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
 exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
 });

 exports.catcher = functions.https.onRequest((request, response) => {
	 console.log('Hello! again');

	 let data = request.body;
	 console.log(data);
	 console.log(data.moredata2);
	 var year = data.year;
	 var team_number = data.team_number;
	 var competition = data.competition;
	 var match = data.match;
	 var record = data.record;
	 
	 if (!year || !team_number || !competition || !match || !record) {
	     response.send("0");
	 } else {

	     var refpath = year + "/" + team_number + "/" + competition + "/" + match;
	     
	
	     // Initialize Firebase
	     var config = {
		 apiKey: "AIzaSyAJtiy-xB69zjg7VRdBiEDmtupBeoGgS9A",
		 authDomain: "nasa-7a363.firebaseapp.com",
		 databaseURL: "https://nasa-7a363.firebaseio.com",
		 projectId: "nasa-7a363",
		 storageBucket: "nasa-7a363.appspot.com",
		 messagingSenderId: "885889218553"
	     };
	     (!firebase.apps.length) ? firebase.initializeApp(config) : firebase.app();
	     //firebase.initializeApp(config);
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

