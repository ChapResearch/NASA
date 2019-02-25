//
// Season Functions
//
//   These are Google Firebase functions for processing the NASA scouting season
//   XML files.  The following are currently implemented here:
//
//   season() - returns the XML for the "current" season. The idea is that
//                   the Contributor app can just go to one spot and get the
//                   right file for painting the screen.  It is normally connected to the
//                   website through a rewrite.
//
//                   CURRENTLY it is hardwired to the 2019 season. 
//
//   seasonJSON() - returns a JSON representation of the XML file. Not only
//                   is it a representation of the XML file, it has also been
//                   processed into a form more suitable for all of the tools that
//                   use it. (see below) It is normally connected to the webite through
//                   a rewrite.  NOTE, that the Contributor app always uses
//                   the XML because it needs to have a file that is cached for
//                   offline operation. NOTE that the JSON file doesn't even HAVE
//                   the layout information in it.
//
//                   CURRENTLY it is hardwired to the 2019 season. 
//                   CURRENTLY it does a redirection return, it should really just
//                   do it like the season() above.
//
//   seasonJSONgenerate() - parses the season XML file and generates the associated
//                   JSON. It re-organizes the file into an appropriate form to make
//                   the other tools' jobs easier.  It is connect to an upload event
//                   to the NASA storage.
//
//                   CURRENTLY it doesn't do error checking like it should.

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

    ref.getDownloadURL()
    	.then((url) => reqGet(url))
	.then((body) => response.send(body))
//	.then((url) => response.redirect(url))
	.catch(function(error) {
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

    // TODO - allow specifying the JSON
    
    ref.getDownloadURL()
    	.then((url) => reqGet(url))
	.then((body) => response.send(body))
	.catch(function(error) {
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
	.catch((err) => {
	    console.log("error from XML parsing: " + err);
	})
	.then((xmlresult) => organizeFieldData(xmlresult))
	.then((xmlobject) => toRef.putString(JSON.stringify(xmlobject)))
	.then((snapshot) => {
	    console.log("done");
	    return(true);
	});
});

//
// organizeFieldData() - given the XML file, organize all of the field data (both raw and meta)
//                       so that it can be processed well/easily.  Note that the metadata fields
//                       are topographically ordered, so they can be processed in the order given
//                       to ensure that dependencies are satisfied before use.
//             
//           RETURNS: { rawData:[raw data fields],
//                      views:[views],
//                      metaData:{ match:[match meta data fields],
//                                 competition:[competition meta data fields],
//                                 robot:[robot meta data fields],
//                                 year:[year meta data fields] }
//                     }
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
// fieldClone() - Clones a field object into a brand-spanking new field object
//                which is returned. This is necessary when modifying objects as
//                they are copied for multiple perspectives.
//
function fieldClone(field)
{
    // first, just get a copy of the object itself

    var clone = Object.assign({},field);                // clone ALL object fields

    var listFields = ["perspective","target","start","end","targetVal"];    // then replace arrays with clones

    listFields.forEach((listField) => {
	if(clone.hasOwnProperty(listField)) {
	    clone[listField] = field[listField].slice(0);
	}
    });

    return(clone);
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

	var listFields = [ "perspective","target","start","end","targetVal" ];
	
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
    //   differing perspectives.  There are two rules:
    //
    //   1 - "higher" perspective metadata is computed AFTER "lower"
    //       perspective metadata
    //   2 - Metadata that depends upon other metadata is computed
    //       after it - on whichever level it is being computed.
    //   3 - References to "target data" from one perspective is
    //       filled, first, from a lower-level perspective, then
    //       from fields in the current perspective.
    //
    //   Rules 1 & 2 have a couple imporant corollaries:
    //   - ALL lower level computations are done before higher
    //     level computations are done - even if a high-level
    //     computation doesn't depend on a particular lower-level item.
    //   - no lower-level computation can depend on a higher-level
    //     computation.
    //   - dependencies come ONLY from the current perspective
    //     AND the next lower perspective.
    //   - a perspective can assume that ALL lower-level computations
    //     have been done.
    //
    //   These two rules are implemented in two steps'ish.  First,
    //   the metadata fields are organized into buckets for each
    //   perspective level (and possibly duplicated to live in each
    //   level) and then a topographic sort is done to ensure that
    //   all data is computed in the right order.
    //   
    //   To do all of this, a graph is created, and then a topographical
    //   sort is done upon it.

    var perspectives = [ "match", "competition", "robot", "year", "top" ];

    var returnData = {};
    
    perspectives.forEach((perspective) => {

	// do each perspective separately

	var graph = [];
	var selfDependentFields = [];

	var dependencyFields = ["target","start","end"];
    
	fields.forEach((field) => {
	    if(field.perspective.includes(perspective)) {
		var name = field.name;
		dependencyFields.forEach((dependencyField) => {
		    if(field.hasOwnProperty(dependencyField)) {
			field[dependencyField].forEach((f) => {
			    if(name == f) {                      // apparent self-dependent names are level-to-level
				selfDependentFields.push(name);  //   so no dependencies are useful
			    } else {
				graph.push([name,f]);            // otherwise they are part of the topo-sort
			    }
			})
		    }
		});
	    }
	});

	// the "legalOrder" is one such order that ensures that all
	//   dependencies are calculated first, before the fields that
	//   depend upon them. Because there are probably numerous fields
	//   that are from raw data, there are probably multiple legal orders.
    
	var legalOrder = toposort(graph).reverse();

	// add the self-dependent fields to the end of the legal order

	legalOrder.push.apply(legalOrder,selfDependentFields);

	// now we take that legal order, and ensure that fields are in
	// that order. Note that legalOrder is a superset of all fields,
	// so we use that to enumerate the list.

	var perspectiveFields = [];
    
	legalOrder.forEach(function(orderedField) {
	    var target = fields.find((fieldObject) => {
		var rightField = fieldObject.name == orderedField;
		var rightPerspective = fieldObject.perspective.includes(perspective);
		return(rightField && rightPerspective);
	    });
	    if(target) {
		var clone = fieldClone(target);
		clone.perspective = [perspective];      // each fields ends-up with only ONE perspective
		perspectiveFields.push(clone);          //    with potentially multiple copies of the field
	    }
	});

	returnData[perspective] = perspectiveFields;
    });

    return(returnData);
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
