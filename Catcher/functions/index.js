
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


//sum test function
//listens for a new number in records and creates a sum to enter back into database

exports.sum = functions.database.ref('/{year}/{team_number}/{competition}/{match}')

.onCreate((snapshot, context) => {
	
	const original = snapshot.val();
	console.log('sum function');
	console.log(original);
	
	var one = parseInt(original.one);
	var two = parseInt(original.two);
	var three = parseInt(original.three);
	var sum = one + two + three;


	original.sum = sum;
	return snapshot.ref.update(original);


    });


exports.sumPanelRocket = functions.database.ref('/{year}/{team_number}/{competition}/{match}')

.onCreate((snapshot, context) => {
	
	const original = snapshot.val();
	console.log('total number of panels on rocket');
	console.log(original);
	
	var levelone = original.panelScoredRocketLvl1.length;
	var leveltwo = original.panelScoredRocketLvl2.length;
	var levelthree = original.panelScoredRocketLvl3.length;
	var sumPanelRocket = levelone + leveltwo + levelthree;


	original.sumPanelRocket = sumPanelRocket;
	return snapshot.ref.update(original);


    });

exports.sumPanelCargo = functions.database.ref('/{year}/{team_number}/{competition}/{match}')

.onCreate((snapshot, context) => {
	
	const original = snapshot.val();
	console.log('total number of panels in cargo bay');
	console.log(original);
	
	var levelone = original.panelScoredCargoLeft.length;
	var leveltwo = original.panelScoredCargoMiddle.length;
	var levelthree = original.panelScoredCargoRight.length;
	var sumPanelCargo = levelone + leveltwo + levelthree;


	original.sumPanelCargo = sumPanelCargo;
	return snapshot.ref.update(original);


    });


exports.sumCargoRocket = functions.database.ref('/{year}/{team_number}/{competition}/{match}')

.onCreate((snapshot, context) => {
	
	const original = snapshot.val();
	console.log('total number of cargo in rocket');
	console.log(original);
	
	var levelone = original.cargoScoredRocketLvl1.length;
	var countCargoRocket = levelone;

	var sum = 0;
	for (var i = 0; i<countCargoRocket; i++){
	    sum += parseInt(original.cargoScoredRocketLvl1[i]);
	} 
 
	var avg = sum/countCargoRocket;

	original.countCargoRocket = countCargoRocket;
	original.avgCargoRocket = avg;
	return snapshot.ref.update(original);


    });
