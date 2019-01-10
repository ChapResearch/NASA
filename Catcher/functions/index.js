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

	 console.log(data.data);
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
	 var ref = database.ref("Anna");

	 ref.on('value', function(snapshot) {
		 console.log(snapshot.val());
	     });


	 ref.set(data.data);
	 if (data.password == "floopy") {
	     response.send("Yes\n");
	 } else {
	     response.send("No\n");
	 }


 });
