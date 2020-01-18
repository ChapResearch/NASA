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
//                   NOTE - the firebase storage file NASA/Season/SEASONFILE is
//                   where the name of the *actual* season XML file.
//
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
const Busboy = require('busboy');

var seasonFile = require('./seasonFile');

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
// season() - return the XML for the "current" season, or for the
//            season specified in the parameters of the GET request.
//            The seasons are kept in the firebase storage (as opposed
//            to database).
//

exports.season = functions.https.onRequest((request, response) => {

    firebaseInit();

    seasonFile.seasonFile(firebase)
	.then((ref) => ref.getDownloadURL())
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

exports.seasonJSON = functions.https.onRequest((request, response) => {

    firebaseInit();

    seasonFile.seasonFile(firebase,true)
	.then((ref) => ref.getDownloadURL())
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

    firebaseInit();
	
    var storage = firebase.storage();

    // we only look at files in "NASA/Season" that end in ".xml"

    // TODO - this should call seasonFile.seasonDir()
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
    var toRef = storage.ref(seasonFile.seasonDir() + basename + ".json");

    return fromRef.getDownloadURL()
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

    var listFields = ["perspective","target","start","end","targetVal",
		      "multiplier","low","high" ];    // then replace arrays with clones

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

    console.log(app);
    
    var metaFields = app.metaData[0].field;    // array of field objects

    var fields = [];

    for(var i=0; i < metaFields.length; i++) {

	var incomingFieldObj = metaFields[i];

	// for each of the fields in the array, the name needs to be extracted,
	//   and each of the attributes needs to be processed AWAY from being an
	//   array. So each is enumerated appropriately.

	var newObject = {};

	var baseFields = [ "name","type","label","op",'eqVal','ltVal','gtVal'];

	baseFields.forEach(function(field) {
	    if(incomingFieldObj.hasOwnProperty(field)) {	    
		newObject[field] = incomingFieldObj[field][0];   // our xml has arrays for every field
	    }
	});

	var listFields = [ "perspective","target","start","end","targetVal",
			   "multiplier","low","high" ];
	
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
	    if(!field.hasOwnProperty("perspective")) {
		throw "METADATA ERROR: " + field.name + " missing perspective (fatal)";
	    }
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

	var baseFields = [ "name","type","label", "perspective", "sort" ];

	baseFields.forEach(function(field) {
	    if(viewObject.hasOwnProperty(field)) {	    
		newObject[field] = viewObject[field][0];
	    }
	});

	var listFields = [ "field","constraint","format","total","average","option" ];
	
	listFields.forEach(function(field) {
	    if(viewObject.hasOwnProperty(field)) {
		newObject[field] = viewObject[field];
	    }
	});

	views.push(newObject);
    }

    return(views);
}

//
// seasonXMLvalidate() - given an incoming multi-part post request with an XML file, validate
//                       that it is "correct" - where "correct" is defined as parsable,
//                       full with the appropriate sections, and referentially correct.
//
exports.seasonXMLvalidate = functions.https.onRequest((request, response) => {

    firebaseInit();

    // TODO - currently this is written for multipart data ONLY - it should
    //   be smarter.

    // busboy - is a library used to extract stuff from a form submit - it is
    //    being used in a very simple way here, because the XML files are small

    const busboy = new Busboy({headers:request.headers});

    busboy.on('file',(fieldname,file,filename) => {
	file.on('data',(data)=> {
	    var xml = data.toString('utf8');
	    
	    XMLparse(xml,{trim: true})
		.catch((err) => {
		    response.send("Error from XML parsing: " + err + "\n");
		})
		.then((xmlresult) => organizeFieldData(xmlresult))
		.then((xmlobject) => checkData(xmlobject))
		.then((results) => response.send(results))
		.catch(function(error) {
		    response.send(error);
		});
	});
    });

    // kick-off the busboy processing of our data
	      
    busboy.end(request.rawBody);

    return;
});

//
// checkData() - given an object, representing the parse of the XML, look
//               through it, validating things.  The output comes back
//               as a string.
//
function checkData(xmlobject)
{
    var output = "";

    // TODO - make sure each field has a name, type, op, label (warning), and perspective

    // TODO - make sure, depending upon the op, that the other fields are there
    //        (the array below is the current requirements)

    var reqFields = { count:   ["target"],
		      average: ["target"],
		      combine: ["target"],
		      delta:   ["start","end"],
		      sum:     ["target"],
		      percent: ["target","targetVal"],
		      weight:  ["target","multiplier"],
		      contains:["target","targetVal"],
		      containsAny:["target","targetVal"],
		      max:     ["target"],
		      min:     ["target"],
		      defEffect: ["target"],
		      compare: ["target"],
		      divide:  ["target"],
		      multiply:["target"],
		      subtract:["target"]
		    };

    var optFields = { weight: ["high","low"],
		      compare: ['ltVal','gtVal','eqVal']
		    };
	
	
    // TODO - should check that all of the right things are there for the ops
    //          (like start and end for delta, etc.)

    // TODO - make sure all sections are there

    // TODO - make sure the layout looks good relative to elements

    var rawData = xmlobject.rawData;

    var rawDataFields = [];
    for(var i=0; i < rawData.length; i++) {
	rawDataFields.push(rawData[i].name);
    }

    var metaData = xmlobject.metaData;

    // need to check the perspectives in order, from lowest to highest
    
    var perspectives = [ "match", "competition", "robot", "year", "top" ];
    var previousLevelFields = null;      // allows upper levels to check lower levels

    var allMetaDataFields = [];
    
    for(var perspective in perspectives) {
	var thisMetaData = metaData[perspectives[perspective]];

	// first, gather the names of all of the metaData fields at this perspective
	var thisMetaDataFields = [];
	for(var i=0; i < thisMetaData.length; i++) {
	    thisMetaDataFields.push(thisMetaData[i].name);
	    allMetaDataFields.push(thisMetaData[i].name);
	}

	// now check to see that they refer to rawData, the current metaData, or lower MetaData

	for(var i=0; i < thisMetaData.length; i++) {

	    // need to check the targets, start list, and end list

	    var checks = ["target","start","end"];

	    for(var check in checks) {
		var thisCheck = checks[check];
		
		if(thisMetaData[i].hasOwnProperty(thisCheck)) {
		    for(var j=0; j < thisMetaData[i][thisCheck].length; j++) {
			if(!thisMetaDataFields.includes(thisMetaData[i][thisCheck][j])) {
			    if(!rawDataFields.includes(thisMetaData[i][thisCheck][j])) {
				if(!previousLevelFields || !previousLevelFields.includes(thisMetaData[i][thisCheck][j])) {
				    output += "METADATA ERROR: " +
					perspectives[perspective] + ":" + thisMetaData[i].name + " - " +
					'bad reference in ' + thisCheck + ' - ' +
					thisMetaData[i][thisCheck][j]  + '<br>' + '\n';
				}
			    }
			}
		    }
		}
	    }
	}
	previousLevelFields = thisMetaDataFields;
    }

    output += checkViews(xmlobject.views,rawDataFields,allMetaDataFields);
   
    if(output == ""){
	output += "NO ERRORS FOUND";
    }
    
    return(output);
}

function checkViews(views,rawDataFields,metaDataFields)
{
    var output = "";
    
    var viewReqSections = [ 'name','label','type','perspective','field' ];

    var validConstraints = [ 'year','robot','competition','match'];
    var validFormats = [ 'toFixed','percent' ];
    var validSorts = [ 'ASC','DESC' ];
    var validOptions = [ 'robotGroup' ];

    // this little array set's up validation of optional sections, the array is as follows:
    //    [0] = name of section
    //    [1] = true if an array, false if single value
    //    [2] = array of valid values, or null to indicate a valid view field must be specified
    //    [3] = array of valid modifiers which will follow by a comma, or null if no modifiers valid
    
    var viewOptSections = [ ['average',null,        null],
			    ['option', validOptions,null],
			    ['total',  null,        null],
			    ['sort',   null,        validSorts],
			    ['format', null,        validFormats ]
			  ];


    // fields added automatically by the system
    var specialFields = [ 'year','robot','competition','match', 'date'];

    for(var i=0; i < views.length; i++) {

	// make sure we have the required sections
	for(var j=0; j < viewReqSections.length; j++) {
	    if(!views[i].hasOwnProperty(viewReqSections[j])) {
		output += "VIEWS ERROR: " + views[i].name + ' - Missing section: "' + viewReqSections[j] + '"<br>\n';
	    }
	}

	// if there is no constraint, warn
	if(!views[i].hasOwnProperty("constraint")) {
	    output += "VIEWS WARNING: " + views[i].name + ' - Missing section: "constraint"<br>\n';
	} else {
	    // make sure the named constraints are valid ones
	    for(var j=0; j < views[i].constraint.length; j++) {
		var constraint = views[i].constraint[j];
		if(!validConstraints.includes(constraint)) {
		    output += "VIEWS ERROR: " + views[i].name + ' - invalid constraint: "' + constraint + '"<br>\n';
		}
	    }
	}

	// make sure all fields can be found SOMEWHERE (it's hard to tell where they SHOULD come from)

	for(var j=0; j < views[i].field.length; j++) {
	    var fieldName = views[i].field[j];
	    if(!rawDataFields.includes(fieldName) &&
	       !metaDataFields.includes(fieldName) &&
	       !specialFields.includes(fieldName) ) {
		output += "VIEWS ERROR: " + views[i].name + ' - invalid field: "' + fieldName + '"<br>\n';
	    }
	}

	// process the optional sections

	for(var j=0; j < viewOptSections.length; j++) {

	    var sectName = viewOptSections[j][0];        // name of optional section
	    var sectValues = viewOptSections[j][1];      // array of valid values, if null, a valid view field req'd
	    var sectModifiers = viewOptSections[j][2];   // null if no modifiers, array of valid mods otherwise

	    if(views[i].hasOwnProperty(sectName)) {
		var values = views[i][sectName];
		if(!Array.isArray(values)) {             // treat all sections like arrays here
		    values = [values];
		}
		for(var k=0; k < values.length; k++) {
		    var valueSplit = values[k].split(',');

		    if(!sectValues &&
		       !views[i].field.includes(valueSplit[0]) &&
		       !specialFields.includes(valueSplit[0])) {
			output += "VIEWS ERROR: " + views[i].name +
			    ' - unknown ' + sectName + ' field: "' + valueSplit[0] + '"<br>\n';
		    } else if(sectValues && !sectValues.includes(valueSplit[0])) {
			output += "VIEWS ERROR: " + views[i].name +
			    ' - unknown ' + sectName + ' value: "' + valueSplit[0] + '"<br>\n';
		    } else if(sectModifiers) {
			if(!valueSplit[1]) {
			    output += "VIEWS ERROR: " + views[i].name +
				' - missing modifier for ' + sectName + ': "' + valueSplit[0] + '"<br>\n';
			} else if(!sectModifiers.includes(valueSplit[1])) {
			    output += "VIEWS ERROR: " + views[i].name +
				' - bad modifier "' + valueSplit[1] + '" for ' +
				sectName + ': "' + valueSplit[0] + '"<br>\n';
			}
		    }
		}
	    }
	}
    }

    return(output);
}
    
