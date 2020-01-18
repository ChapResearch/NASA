const functions = require('firebase-functions');

// NOTE - this next line often produces a deployment error that firebase
//        isn't found.  You need to run "npm install firebase --save" in the
//        functions directory to fix it!  It updates the requirements .json.

var firebase = require('firebase');


//var XMLparse = require('xml2js').parseString;
var XMLparse = require('xml2js-es6-promise');

var requestMod = require('request');
var reqGet = require('request-promise');

require('firebase/storage');            // extremely important! (firebase must exist)


global.XMLHttpRequest = require("xhr2");   // necessary for the getDownloadURL()

var toposort = require("toposort");

var metaData = require('./calcMetaData');

var seasonFile = require('./seasonFile');

var METADATA = "_metaData";

//
// firebaseInit() - inits if necessary.
//
function firebaseInit()
{
    var NASA_FBconfig = {
	    apiKey: "AIzaSyAJtiy-xB69zjg7VRdBiEDmtupBeoGgS9A",
	    authDomain: "nasa-7a363.firebaseapp.com",
	    databaseURL: "https://nasa-7a363.firebaseio.com",
	    projectId: "nasa-7a363",
	    storageBucket: "nasa-7a363.appspot.com",
	    messagingSenderId: "885889218553"
	};


    // don't initialize the app if it already appears to be intialized
    //   note that this only works right if we have 1 app - otherwise,
    //   this would need to see if THIS app is initialized
    
    if(firebase.apps.length == 0) {
	firebase.initializeApp(NASA_FBconfig);
//	console.log("initialized");
    } else {
//	console.log("didn't initialize");
    }
}

//
// superiorStats() - compute the statistics at all upper levels beyond the match.
//                   This is a URL that is called to refresh the stats. It CAN be
//                   called like a CRON job, or can be called from the UI.
//
exports.superiorStats = functions.https.onRequest((request, response) => {

    // the request itslef is currently ignored, just calling it causes the computation
    //   of the superior stats.

    firebaseInit();

    // get the ENTIRE DATABASE (yikes) for doing this computation
    
    var ref = firebase.database().ref("/");
    var data;

    ref.once("value")
        .then((snapshot) => {
	    data = snapshot.val();
	    return(getNASAdataJSON());
	})
	.then((nasaData) => metaData.calcMetaDataUpper(data,nasaData.metaData,ref))

    // The above routine used to update all of the data, then the following would
    // slam it all back into the database. But this caused a cascade of things that
    // "looked" like they changed. So now the routine does the changes directly to
    // the right spot in the database.  OLD CODE BELOW:
    //
    //	.then((newvalue) => ref.set(newvalue))
    
    // and if things go wrong
    
	.catch((e)=>console.log(e));

    response.send("OK");
    return(1);
    
});

//
// matchStats() - compute the statistics for a particular match. NOTE that this
//                does NOT compute the stats for higher perspectives. This is
//                wired to a an onWrite() event so that it notices both when
//                the record is created and when it is updated (this WILL be
//                necessary when new stats are added).
//
exports.matchStats = functions.database.ref('{year}/{robot}/{competition}/{match}').
    onWrite((change,context) => {

	firebaseInit();

	if(context.params.match == METADATA ||
	   context.params.competition == METADATA ||
	   context.params.robot == METADATA ||
	   context.params.year == METADATA	  ) {
	    return null;               // don't process metaData leaves that just "happen" sometimes
	                               // particularly at the competition & match levels
	}

	if(!change.after.exists()) {   // key deleted - so just exit
	    return null;
	}

	var newRecord = false;
	
	if(change.before.exists()) {  // updating an existing record
	    if(change.after.val().hasOwnProperty('updated')) {
		// it's already been updated, don't do it again
		// delete this key to cause a re-update
		return(null);
	    } else {
		console.log("re-computing existing record");
	    }
	} else {                      // brand-spanking new record
	    newRecord = true;
	}
	
	// otherwise we have either a create or a change, in any event
	//  work with the new data.

	getNASAdataJSON()
	    .then((nasaData) => metaData.calcMetaData(change.after.val(),context.params,nasaData.metaData.match))
	    .then((newvalue) => {
		if(newRecord) {
		    newvalue.date = firebase.database.ServerValue.TIMESTAMP;
		}
		newvalue.updated = firebase.database.ServerValue.TIMESTAMP;
		change.after.ref.set(newvalue);
	    })
		
	// and if things go wrong
	
	    .catch((e)=>console.log(e));

	return(1);
    });
	


//
// recalculate() - kicks-off a recalculation of ALL of the match metadata.
//                 This is done by simply deleting the "updated" key in
//                 each match - everywhere!  Only do this if the metaData
//                 for the match changes.
//
exports.recalculate = functions.https.onRequest((request, response) => {

    firebaseInit();

    // get the ENTIRE DATABASE (yikes) for doing this computation
    
    var ref = firebase.database().ref("/");

    // now cruise through the data to each leaf (match), deleting the "updated" field

    ref.once("value")
        .then((snapshot) => {
	    data = snapshot.val();
	    for(var year in data) {
		if(year != METADATA && data.hasOwnProperty(year)) {
		    for(var robot in data[year]) {
			if(robot != METADATA && data[year].hasOwnProperty(robot)) {
			    for(var competition in data[year][robot]) {
				if(competition != METADATA && data[year][robot].hasOwnProperty(competition)) {
				    for(var match in data[year][robot][competition]) {
					if(match != METADATA && data[year][robot][competition].hasOwnProperty(match)) {
					    ref.child(year).child(robot).child(competition).child(match).child("updated").remove();
					}
				    }
				}
			    }
			}
		    }
		}
	    }
	});

    response.send(200);
});



//
// statistics() - compute statistics for a robot, based upon being notified
//                that a change in the database occurred.
//
exports.statistics = functions.database.ref('{year}/{robot}/{competition}/{match}').
    onCreate((snapshot,context) => {

	// don't initialize the app if it already appears to be intialized
	//   note that this only works right if we have 1 app - otherwise,
	//   this would need to see if THIS app is initialized
	
	if(firebase.apps.length == 0) {
	    firebase.initializeApp(NASA_FBconfig);
	    console.log("initialized");
	} else {
	    console.log("didn't initialize");
	}
	
	// first, get the XML data describing our data/metadata
	//	getNASAdataXML()

	getNASAdataJSON()
	    .then((nasaData) => metaData.calcMetaData(context.params,nasaData))
	    .then((newvalue) => snapshot.ref.set(newvalue))
		
	// and if things go wrong
	
	    .catch((e)=>console.log(e));

	return(1);
    });

//
// getNASAdataJSON() - get the "standard" xml data for NASA, but in json format.
//                     This counts on the XML processing that occurs in the Season
//                     functions directory.
//
//                     Returns a promise, that propagates with the data object that
//                     was converted from JSON.
//
function getNASAdataJSON()
{
    return(
	seasonFile.seasonFile(firebase,true)
	    .then((ref) => ref.getDownloadURL())
	    .then((url) => reqGet(url))
            .then((body) => JSON.parse(body)));

}    

//
// getNASAdataXML() - get the "standard" xml data for NASA. This is kept in
//                    the storage side of firebase, so it is referenced as
//                    such.
//          RETURNS: a promise that is the last in the chain of ops needed to
//                    retrieve and parse the XML data.
//
function getNASAdataXML()
{
    return(
	seasonFile.seasonFile(firebase)
	    .then((ref) => ref.getDownloadURL())
	    .then((url) => reqGet(url))
            .then((body) => XMLparse(body,{trim: true}))
	    .then((xmlresult) => organizeFieldData(xmlresult)));
}

//
// xmlTest() - gets the XML from the "standard" storage location,
//             parses it, then logs the result
//
exports.xmlTest = functions.https.onRequest((request, response) =>
{
    var config = {
	apiKey: "AIzaSyAJtiy-xB69zjg7VRdBiEDmtupBeoGgS9A",
	authDomain: "nasa-7a363.firebaseapp.com",
	databaseURL: "https://nasa-7a363.firebaseio.com",
	projectId: "nasa-7a363",
	storageBucket: "nasa-7a363.appspot.com",
	messagingSenderId: "885889218553"
    };

    // don't initialize the app if it already appears to be intialized
    //   note that this only works right if we have 1 app - otherwise,
    //   this would need to see if THIS app is initialized
    
    if(firebase.apps.length == 0) {
	firebase.initializeApp(config);
	console.log("initialized");
    } else {
	console.log("didn't initialize");
    }

    seasonFile.seasonFile(firebase)
	.then((ref) => ref.getDownloadURL())
	.then(function(url) {

	var origResponse = response;
	requestMod.get(url,
	    function(error,response,body) {

//		console.log('error:',error);
//		console.log('response:',response);
//		console.log('body:',body);

		XMLparse(body,function(xmlerror,xmlresult) {
		    var fieldData = organizeFieldData(xmlresult);
		    var rawFields = fieldData[0];
		    var metaFields = fieldData[1];

		    console.log(rawFields);
		    console.log(metaFields);
		    
		    origResponse.send("Stats processed");
		});
	    });

    }).catch(function(error) {
	console.log(error.code);
	response.send("Error");
    });

});

//
// organizeFieldData() - given the XML file, organize all of the field data (both raw and meta)
//                       so that it can be processed well/easily.
//           RETURNS: an array where [0] = raw field data, and [1] = meta field data
//
function organizeFieldData(xmlObj)
{
    var retObj = {};

    retObj["rawData"] = rawFieldData(xmlObj);
    retObj["metaData"] = metaFieldData(xmlObj);

    return(retObj);
}

//
// rawFieldData() - examines the "<elements>" section of the XML file to extract
//                  all of the fields found there. They are organized into an
//                  array of objects, with each object having the properties defined
//                  in the XML.  Note that the order returned is the same order as
//                  specified in the XML.
//
//                  Most of the XML arrays are smushed into a single value, except
//                  choices.
//
function rawFieldData(xmlObj)
{
    var app = xmlObj.app;                     // top level is the app
    var rawFields = app.elements[0].field;    // array of field objects

    var fields = [];

    for(var i=0; i < rawFields.length; i++) {

	var incomingFieldObj = rawFields[i];

	// for each of the fields in the array, the name needs to be extracted,
	//   and each of the attributes needs to be processed AWAY from being an
	//   array. So each is enumerated appropriately.

	var newObject = {};

	var baseFields = [ "name","type","label","default","min","max" ];

	baseFields.forEach(function(field) {
	    if(incomingFieldObj.hasOwnProperty(field)) {	    
		newObject[field] = incomingFieldObj[field][0];   // our xml has arrays for every field
	    }
	});

	// TODO - there could be a tie-in to XML validation here

	// now process the choices for those with choices
	//  This COULD be organized as an object where the values are property names,
	//  (which is how it was originally coded) but instead it is coded as an array
	//  of simply choice objects with { "value":v, "label":l }
	
	if(incomingFieldObj.hasOwnProperty("choice")) {
	    var choiceArray = [];
	    for(var j=0; j < incomingFieldObj["choice"].length; j++) {
		var choiceObj = {};
		choiceObj["value"] = incomingFieldObj["choice"][j]["value"][0];
		choiceObj["label"] = incomingFieldObj["choice"][j]["label"][0];
		choiceArray.push(choiceObj);
	    }
	    newObject["choice"] = choiceArray;
	}

	fields.push(newObject);
    }

    return(fields);
}

//
// metaFieldData() - examines the "<metaData>" section of the XML file to extract
//                  all of the fields found there. They are organized into an
//                  ORDERED array, where the order refers to the calculation order
//                  because some meta fields may depend upon others. The array consists
//                  of objects with each having a name.
//
function metaFieldData(xmlObj)
{
    var app = xmlObj.app;                     // top level is the app
    var metaFields = app.metaData[0].field;    // array of field objects

    var fields = [];

    for(var i=0; i < metaFields.length; i++) {

	var incomingFieldObj = metaFields[i];

	// for each of the fields in the array, the name needs to be extracted,
	//   and each of the attributes needs to be processed AWAY from being an
	//   array. So each is enumerated appropriately.

	var newObject = {};

	var baseFields = [ "name","type","label","op" ];

	baseFields.forEach(function(field) {
	    if(incomingFieldObj.hasOwnProperty(field)) {	    
		newObject[field] = incomingFieldObj[field][0];   // our xml has arrays for every field
	    }
	});

	var listFields = [ "perspective","target","start","end" ];
	
	listFields.forEach(function(field) {
	    if(incomingFieldObj.hasOwnProperty(field)) {
		newObject[field] = incomingFieldObj[field];
	    }
	});

	fields.push(newObject);
    }

    // at this point we have all of the fields in an object
    //   but we need to deal with the inherent ordering required
    //   because of dependencies among the meta fields and their
    //   targets and start/end fields. That is, if one meta field
    //   depends upon another, it needs to be behind it. This is
    //   done through a topological sort. The first step, though,
    //   is to create the graph to allow the sort to work.

    var graph = [];

    var dependencyFields = ["target","start","end"];
    
    fields.forEach(function(field) {
	var name = field.name;
	dependencyFields.forEach(function(dependencyField) {
	    if(field.hasOwnProperty(dependencyField)) {
		field[dependencyField].forEach(function(field) {
		    graph.push([name,field]);
		})
	    }
	});
    });

    // the "legalOrder" is one such order that ensures that all
    //   dependencies are calculated first, before the fields that
    //   depend upon them. Because there are probably numerous fields
    //   that are from raw data, there are probably multiple legal orders.
    
    var legalOrder = toposort(graph).reverse();

    // now we take that legal order, and ensure that fields are in
    // that order. Note that legalOrder is a superset of all fields,
    // so we use that to enumerate the list.

    var retFields = [];
    
    legalOrder.forEach(function(orderedField) {
	var target = fields.find(function(fieldObject) {
	    return(fieldObject.name == orderedField);
	});
	if(target) {
	    retFields.push(target);
	}
    });

    return(retFields);
}
