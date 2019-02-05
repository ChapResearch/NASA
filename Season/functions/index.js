const functions = require('firebase-functions');
var firebase = require("firebase");

var XMLparse = require('xml2js-es6-promise');

var requestMod = require('request');   
var reqGet = require('request-promise');

require('firebase/storage');            // extremely important! (firebase must exist too)

global.XMLHttpRequest = require("xhr2");   // necessary for the getDownloadURL()

var toposort = require("toposort");


var config = {
    apiKey: "AIzaSyAJtiy-xB69zjg7VRdBiEDmtupBeoGgS9A",
    authDomain: "nasa-7a363.firebaseapp.com",
    databaseURL: "https://nasa-7a363.firebaseio.com",
    projectId: "nasa-7a363",
    storageBucket: "nasa-7a363.appspot.com",
    messagingSenderId: "885889218553"
};

//
// season() - return the XML for the "current" season, or for the
//            season specified in the parameters of the GET request.
//            The seasons are kept in the firebase storage (as opposed
//            to database).
//

exports.season = functions.https.onRequest((request, response) =>
{
    if(firebase.apps.length == 0) {
	firebase.initializeApp(config);
	console.log("initialized");
    } else {
	console.log("didn't initialize");
    }

    var storage = firebase.storage();
    //    var ref = storage.ref("NASA/Season/powerUp.xml");
    var ref = storage.ref("NASA/Season/DeepSpace2019.xml");

    ref.getDownloadURL().then(function(url) {
	response.redirect(url);
    }).catch(function(error) {
	console.log(error.code);
	response.send("Error");
    });

});

//
// seasonJSON() - return the JSON for the "current" season, or for the
//            season specified in the parameters of the GET request.
//            The seasons are kept in the firebase storage (as opposed
//            to database).
//

exports.seasonJSON = functions.https.onRequest((request, response) =>
{
    if(firebase.apps.length == 0) {
	firebase.initializeApp(config);
	console.log("initialized");
    } else {
	console.log("didn't initialize");
    }

    var storage = firebase.storage();
    //    var ref = storage.ref("NASA/Season/powerUp.xml");
    var ref = storage.ref("NASA/Season/DeepSpace2019.json");

    ref.getDownloadURL().then(function(url) {
	response.redirect(url);
    }).catch(function(error) {
	console.log(error.code);
	response.send("Error");
    });

});

//
// seasonJSONgenerate - FUNCTION
//
//    This function kicks in whenever a new xml is loaded into the NASA
//    storage area. It generates a JSON version of the file, after appropriate
//    processing.
//
exports.seasonJSONgenerate = functions.storage.object().onFinalize((object) => {

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
	
    var storage = firebase.storage();

    // we only look at files in "NASA/Season" that end in ".xml"

    var filename = object.name.split("/");
    if(filename.length != 3 || filename[0] != "NASA" || filename[1] != "Season") {
	console.log("write in the wrong place");
	return(false);
    }

    filename = filename[2].split(".");
    if(filename.length != 2 || filename[1] != "xml") {
	console.log("wrong file extension");
	return(false);
    }

    var basename = filename[0];

    console.log("working on " + basename);

    var fromRef = storage.ref(object.name);
    var toRef = storage.ref("NASA/Season/" + basename + ".json");
    
    fromRef.getDownloadURL()
	.then((url) => reqGet(url))
	.then((body) => XMLparse(body,{trim: true}))
	.then((xmlresult) => organizeFieldData(xmlresult))
	.then((xmlobject) => toRef.putString(JSON.stringify(xmlobject)))
	.then((snapshot) => {
	    console.log("done");
	    return(true);
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
    retObj["views"] = viewsData(xmlObj);

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

//
// viewsData() - examines the "<views>" section of the XML file to extract
//               all of the viewss found there. They are organized into an
//               array of objects, with each object having the properties defined
//               in the XML.  Note that the order returned is the same order as
//               specified in the XML.
//
function viewsData(xmlObj)
{
    var app = xmlObj.app;             // top level is the app
    var incomingViews = app.views[0].view;    // array of view objects
    
    var views = [];

    for(var i=0; i < incomingViews.length; i++) {

	var viewObject = incomingViews[i];

	var newObject = {};

	var baseFields = [ "name","type","label", "perspective" ];

	baseFields.forEach(function(field) {
	    if(viewObject.hasOwnProperty(field)) {	    
		newObject[field] = viewObject[field][0];
	    }
	});

	var listFields = [ "field","constraint" ];
	
	listFields.forEach(function(field) {
	    if(viewObject.hasOwnProperty(field)) {
		newObject[field] = viewObject[field];
	    }
	});

	views.push(newObject);
    }

    return(views);
}
