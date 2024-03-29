//
// database functions
//
//   Mostly stats, these are the functions that are deployed with this Makefile.
//   The HTTP links are programmed into the web site, see ../../Website/firebase.json.
//   (so check there for the authoratative information about these links)
//   Those functions preceeded by an (X) are NOT deployed, even those they may
//   be exported.
//
//    matchStats() - triggered on a write to firebase, calculates the match stats
//       for the written record, updating the record in place. HTTP LINK - NONE
//
//    recalculate() - clear ALL non-match data, and recalculate it, for all matches
//       in firebase.  This is normally only done when new metadata is needed.
//       - HTTP LINK: /recalculate
//
//    treeIndex() - returns the tree index, which is used to make viewing MUCH
//       faster and lighter weight.  - HTTP LINK: /treeIndex
//
//    rebuildIndex() - rebuilds the tree index from the root  - HTTP LINK: /rebuildIndex
//
//    upperStatsRobot() - process the "robot" level of metadata.  
//    upperStatsYear() -  process the "year" level of metadata
//    upperStatsTop() -  process the "top" level of metadata (above years)
//
//      UPPER STATS FUNCTIONS - these functions are connected to a data write at
//      their particular level, and will calculate when that write occurs. NORMALLY,
//      however, only the robot level is turned on.  In other words, uploaded as a
//      function.
//
//    X catcher
//    X xmlTest

const functions = require('firebase-functions');

// NOTE - this next line often produces a deployment error that firebase
//        isn't found.  You need to run "npm install firebase --save" in the
//        functions directory to fix it!  It updates the requirements .json.

var firebase = require('firebase');
var storage = require('firebase/storage');

var XMLparse = require('xml2js');
var fetch = require('node-fetch');

global.XMLHttpRequest = require("xhr2");   // necessary for the getDownloadURL()

var toposort = require("toposort");

var metaData = require('./calcMetaData');

var seasonFile = require('./seasonFile');

var treeIndex = require('./treeIndex');

//
// There are special nodes in the tree that don't participate
// in stats. These are used for infrastructure or for holding
// stats.
//
var METADATA = "_metaData";        // nodes where Metdata is stored
var INDEX = "_index";              // nodes for the tree overlay index
var FULLINDEX = "_fullindex";      // nodes for the tree overlay FULL index

//
// isSpecialNode() - return true if the given node (as a string) is special
//
function isSpecialNode(nodeString)
{
    return(nodeString[0] == '_');
}

const local = require('./firebaseInit');

//
// upperStats****() - NEW VERSION - ** Tue Mar 10 09:41:22 2020 **
//                   This function will calculate stats at the robot, year,
//                   and top level (although the last two in particular haven't
//                   ever been used). This function can be attached to the
//                   METADATA at the competition, robot, and year level
//                   so that when that data changes the upper level is
//                   re-calculated. This has the potential to cause quite
//                   a bit of function traffic at the year/top level, if there
//                   are any calculations specified, because there are
//                   six robots that change every few minutes.
//

exports.upperStatsRobot = functions.database.ref('{year}/{robot}/{competition}/' + METADATA).
    onWrite((change,context) => upperStats(change,context));

// BIG NOTE - the year and top stats are NOT NORMALLY TURNED ON - see the
//            Makefile in this directory to see which ones are turned on

exports.upperStatsYear = functions.database.ref('{year}/{robot}/' + METADATA).
    onWrite((change,context) => upperStats(change,context));

exports.upperStatsTop = functions.database.ref('{year}/' + METADATA).
    onWrite((change,context) => upperStats(change,context));
	
//
// upperStats() - local function that is used by upperStats*****().  Calculates the METADATA
//                at the given level
//
//                This routine is bound to an onWrite() firebase call on the data at
//                locations that have METADATA, and attached to that METADATA path. Each
//                onWrite() spec includes placeholders for the different perspectives:
//
//                    '{year}/{robot}/{competition}/METADATA'
//                            - causes recalculation of the robot metaData
//
//                    '{year}/{robot}/METADATA'
//                            - causes recalculation of the year metaData
//
//                    '{year}/METADATA'
//                            - causes recalculation of the top metaData
//
//                    '/METADATA'
//                            - INVALID - don't do this - there is nothing to be recalculated
//
//                With the METADATA level given in the references, calculate the stats at the
//                level just above. This involves getting the METADATA from all of the
//                parallel nodes, and running any calculations at the level just above
//                that.
//
//                Note, by-the-way, that the METADATA that was changed just serves to indicate
//                that the upper level needs to be re-calculated. The metaData in the call
//                is not used.
//
//                Returns a promise that does it all.
//
function upperStats(change,context)
{
    local.firebaseInit(firebase);

    // this function doesn't really care what path we're operating at.  It just knows
    // that the ref points to a METADATA and that we need to load the parallel meta data.

    var refString = '/';
    var perspective = 'top';

    if(context.params.hasOwnProperty('robot')) {
	refString += context.params.year;
	perspective = 'year';
    }
    if(context.params.hasOwnProperty('competition')) {
	refString += '/' + context.params.robot;
	perspective = 'robot';
    }

    var ref = firebase.database().ref(refString);

    // At this point, we have a ref that is the point of calculation - all of the
    // METADATA below this point will be the subject of the calculations.

    return(
	getNASAdataJSON()
	    .then((nasaData) => metaData.calcMetaDataUpper(nasaData.metaData,perspective,ref))
	    .then((metaData) => ref.child(METADATA).set(metaData))
    );

}

//
// matchStats() - compute the statistics for a particular match. NOTE that this
//                does NOT compute the stats for higher perspectives. This is
//                wired to a an onWrite() event so that it notices both when
//                the record is created and when it is updated (this WILL be
//                necessary when new stats are added).
//
exports.matchStats = functions.database.ref('{year}/{robot}/{competition}/{match}').
    onWrite((change,context) => {

	local.firebaseInit(firebase);

	if(isSpecialNode(context.params.match) ||
	   isSpecialNode(context.params.competition) ||
	   isSpecialNode(context.params.robot) ||
	   isSpecialNode(context.params.year)) {
	    return null;               // don't process special leaves that just "happen" to fire
	                               // the matchstats function
	}

	console.log('match stats on "' + context.params.year + '/' +
		    context.params.robot + '/' +
		    context.params.competition + '/' +
		    context.params.match + '"');

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

	// later on down the road we'll need the reference to the competition
	//   part of the firebase tree.
	
	var competitionRef = firebase.database().ref(context.params.year + '/' +
						   context.params.robot + '/' +
						   context.params.competition);
	
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

	// here is a change!  At this point, we go ahead and calculate the competition
	// stats. Since normally there is a single match coming in to each robot, there
	// is no reason NOT to go ahead and do the competition stats.  Also, these are
	// the stats that are most useful/needed.  NOTE that we go get the JSON metaData
	// again - as opposed to passing it down somehow.  NOTE TOO - we don't hold on
	// to the match stats data from above, it is set in the record prior to this
	// point so we just get it all anyway.

	    .then(()=> getNASAdataJSON())              // I know, I know, getting it again...
	    .then((nasaData) => metaData.calcMetaDataSpecific(nasaData.metaData,"competition",competitionRef))

	// update the indicies for the new data
	// Previously the "timestamp" was passed as firebase.database.ServerValue.TIMESTAMP,
	//   but that was really overkill, and pretty-much doubled the size of the index.
	//   Now zero is passed, indicating that no data exists below. (this is somewhat
	//   like the firebase REST API "shallow" does)
	
	    .then(() => treeIndex.upperIndexUpdate(firebase.database().ref('/'),
						   context.params.year,
						   context.params.robot,
						   context.params.competition,
						   context.params.match,
						   0))

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

    local.firebaseInit(firebase);

    // get the ENTIRE DATABASE (yikes) for doing this computation
    
    var ref = firebase.database().ref("/");

    // now cruise through the data to each leaf (match), deleting the "updated" field

    ref.once("value")
        .then((snapshot) => {
	    data = snapshot.val();
	    for(var year in data) {
		if(!isSpecialNode(year) && data.hasOwnProperty(year)) {
		    for(var robot in data[year]) {
			if(!isSpecialNode(robot) && data[year].hasOwnProperty(robot)) {
			    for(var competition in data[year][robot]) {
				if(!isSpecialNode(competition) && data[year][robot].hasOwnProperty(competition)) {
				    for(var match in data[year][robot][competition]) {
					if(!isSpecialNode(match) && data[year][robot][competition].hasOwnProperty(match)) {
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
// rebuildIndex(HTTPS) - entry point for the tool to rebuild the tree index.
//                       It starts at the root and rebuilds the whole thing.
//
exports.rebuildIndex = functions.https.onRequest((request,response) =>
{
    local.firebaseInit(firebase);

    var root = "/";

    if(request.query.hasOwnProperty('root')) {
	root = request.query.root;
    }

    // Previously the "timestamp" was passed as firebase.database.ServerValue.TIMESTAMP,
    //   but that was really overkill, and pretty-much doubled the size of the index.
    //   Now zero is passed, indicating that no data exists below. (this is somewhat
    //   like the firebase REST API "shallow" does)
	
    treeIndex.rebuildIndex(firebase.database().ref(root),0)
	.then(_ => response.send('OK'));
});

						 
//
// treeIndex (HTTPS) - entry point for incoming request for the tree index.
//                     if data.root is set, then use it, otherwise just
//                     return the index from the root.
//
//exports.treeIndex = functions.https.onCall((data,context) =>
exports.treeIndex = functions.https.onRequest((request,response) =>
{
    local.firebaseInit(firebase);

    var root = "/";
    var single = false;            // if true, only return the index (not recursive) at the given root

    // use this for an onRequest() style call
    
    if(request.query.hasOwnProperty('root')) {
	root = request.query.root;
    }

    if(request.query.hasOwnProperty('single')) {
	single = true;
    }

    // use this for a onCall() style call
    //
    //    if(data.hasOwnProperty('root')) {
    //       root = data.root;
    //    }

    var indexToUse = single?INDEX:FULLINDEX;
	
    firebase.database().ref(root).child(indexToUse).once("value")
	    .then((snapshot) => response.send(JSON.stringify(snapshot)));

    // BIG NOTE - before the _fullindex was created, the following routine
    //   would recursively go through the whole tree creating a full index.
    //   But that took nearly as long (due to all the database traffic)
    //   as did loading in the whole database.  So now, the _fullindex
    //   is maintained at each level...and is FAR quicker.
    //
    //	treeIndex.treeIndexRecursive(firebase.database().ref(root))
    //      .then((obj) => {
    //          var s = JSON.stringify(obj);
    //		response.send(s);
    //	    });
    //  }

    // use this for an onCall() style call
    // return(index);
    
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
	    .then((url) => fetch(url))
	    .then((body) => body.text())
            .then((contents) => JSON.parse(contents)));

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
	    .then((url) => fetch(url))
	    .then((body) => body.text())
	    .then((contents) => XMLparse.parseStringPromise(contents,{trim: true}))
	    .then((xmlresult) => organizeFieldData(xmlresult)));
}

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
