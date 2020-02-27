var FIREBASE_DATA = null;

//
// PERSPECTIVES is a simple list of perspectives, IN ORDER, that is used to
//         filter records based upon perspective.
//
var PERSPECTIVES = [ "year","robot","competition","match" ];

//
// There are special nodes in the tree that don't participate
// in stats. These are used for infrastructure or for holding
// stats.
//
var METADATA = "_metaData";        // nodes where Metdata is stored
var INDEX = "_index";              // nodes for the tree overlay index
var FULLINDEX = "_fullindex";      // nodes for the tree overlay FULL index
var RECORDID = "id";               // record ordinal - depends upon context

//
// isSpecialNode() - return true if the given node (as a string) is special
//
function isSpecialNode(nodeString)
{
    return(nodeString[0] == '_');
}

//
// databaseLoad() - OK, yikes, this routine downloads the entire database.
//                  For now (and the foreseeable future) this is fine.
//                  It will need to be rethought eventually.
//
function databaseLoad(reload,callback)
{
    if(reload || FIREBASE_DATA === null) {


	var d = new Date();
	var n = d.getTime();
	console.log("database load started at " + n);


	firebase.database().ref('/').once('value')
	//	firebase.database().ref('/_fullindex').once('value')     // 5-10 times faster download
	    .then((data) => {
		FIREBASE_DATA = data;
		var d = new Date();
		console.log("database loaded after " + (d.getTime() - n));
		callback(FIREBASE_DATA);
	    });
    } else {
	callback(FIREBASE_DATA);
    }
}

//
// databaseRecords() - return all database "records" that match the given
//                     constraints. Note that the RECORDID is added to the record
//                     for use later.
//
function databaseRecords(constraints,callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var returnRecords = [];
		     var data = snapshot.val();
		     var id = 1;
		     for(var year in data) {
			 if(!isSpecialNode(year)) {
			     for(var robot in data[year]) {
				 if(!isSpecialNode(robot)) {
				     for(var competition in data[year][robot]) {
					 if(!isSpecialNode(competition)) {
					     for(var match in data[year][robot][competition]) {
						 if(!isSpecialNode(match)) {
						     var record = data[year][robot][competition][match];
						     record.year = year;
						     record.robot = robot;
						     record.competition = competition;
						     record.match = match;
						     record[RECORDID] = id++;
						     if(databaseConstraintMatch(record,constraints)) {
							 returnRecords.push(record);
						     }
						 }
					     }
					 }
				     }
				 }
			     }
			 }
		     }
		     // now, for each return record, add the upper-level metaData

		     for(var i=0; i < returnRecords.length;i++) {
			 var record = returnRecords[i];

			 if(data.hasOwnProperty(METADATA)) {
			     record["top_metaData"] = data[METADATA];
			 }
			 if(data[record.year].hasOwnProperty(METADATA)) {
			     record["year_metaData"] = data[record.year][METADATA];
			 }
			 if(data[record.year][record.robot].hasOwnProperty(METADATA)) {
			     record["robot_metaData"] = data[record.year][record.robot][METADATA];
			 }
			 if(data[record.year][record.robot][record.competition].hasOwnProperty(METADATA)) {
			     record["competition_metaData"] = data[record.year][record.robot][record.competition][METADATA];
			 }
		     }
		     callback(returnRecords);
		 });
}

//
// databasePerspectiveFilter() - "filters out" records that shouldn't be shown for the given
//                               perspective. This filtering out means that at the perspective
//                               level on  DOWN, uniqueness is enforced. That is, only the
//                               first record with a given value of that perspective will
//                               pass the filter.
//
//               NOTE - that a funky mechanism is used here - the "uniquenessArray" is an
//                   array of JSON.stringify'd perspective keys.
//
function databasePerspectiveFilter(records,perspective)
{
    var pindex = PERSPECTIVES.indexOf(perspective);

    if(pindex == -1) {
	console.log("BAD PERSPECTIVE in databasePerspectiveFilter()");
	return([]);
    }

    var uniquenessArray = [];
    var returnRecords = [];

    var id = 1;

    for(var i=0; i < records.length; i++) {
	var key = databasePerspectiveKey(records[i],pindex);
	if(!uniquenessArray.includes(key)) {
	    records[i][RECORDID] = id++;              // rewrite the id for this context
	    returnRecords.push(records[i]);
	    uniquenessArray.push(key);
	}
    }

    return(returnRecords);
}

//
// databasePerspectiveKey() - given a record, and a perspective, return the "key" that
//                            represents that perspective for the record.  The key is
//                            a JSON.stringify'd object.
//
function databasePerspectiveKey(record,pindex)
{
    var key = {};
    for(var i=0; i <= pindex; i++) {
	key[PERSPECTIVES[i]] = record[PERSPECTIVES[i]];
    }
    return(JSON.stringify(key));
}

//
// databaseConstraintMatch() - returns true if the given constraints match the given record
//
//    constraints: { year:year, robot:robot, competition:competition, match:match };
//
//        If any of the constraints are null,0, or empty, then it is ignored.
//
//        If a constraint is an array, the matching of ANY of the particular constraint
//        is sufficient.
//
function databaseConstraintMatch(record,constraints)
{
    var recordMatch = true;
    
    for(var constraint in constraints) {

	var thisConstraint = constraints[constraint];

	if(thisConstraint) {
	    if(!Array.isArray(thisConstraint)) {       // turn it into an array always
		thisConstraint = [thisConstraint];
	    }
	    var thisMatch = false;
	    for(var i=0; i < thisConstraint.length; i++) {
		if(record[constraint] == thisConstraint[i]) {
		    thisMatch = true;
		    break;
		}
	    }
	    if(!thisMatch) {
		recordMatch = false;
		break;
	    }
	}
    }

    return(recordMatch);
}

//
// databaseGetYears() - get all years in the database (all the way at the top)
//
function databaseGetYears(callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var years = [];
		     for(var year in snapshot.val()) {
			 if(!isSpecialNode(year)) {
			     if(!years.includes(year)) {
				 years.push(year);
			     }
			 }
		     }
		     callback(years.sort((a,b)=>a-b));
		 });
}

//
// databaseGetRobots() - get all robots at the top level given the constraints.
//                       If a constraint is null, ignore it.
//
function databaseGetRobots(years,callback)
{
    console.log("getting robots with years as " + years);
    
    databaseLoad(false,
		 (snapshot) => {
		     var robots = [];
		     for(var year in snapshot.val()) {
			 if(!isSpecialNode(year)) {
			     if(years.length == 0 || years.includes(year)) {
				 for(var robot in snapshot.val()[year]) {
				     if(!isSpecialNode(robot)) {
					 console.log("looking at robot:" + robot);
					 if(!robots.includes(robot)) {
					     robots.push(robot);
					 }
				     }
				 }
			     }
			 }
		     }
		     callback(robots.sort((a,b)=>a-b));
		 });
}

//
// databaseGetCompetitions() - get a list of the competitions for the given
//                             year and given robot. If no robot is given, then
//                             all competitions are returned.
//
function databaseGetCompetitions(years,robots,callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var data = snapshot.val();
		     var competitions = [];
		     for(var year in data) {
			 if(!isSpecialNode(year)) {
			     if(years.length == 0 || years.includes(year)) {
				 for(var robot in data[year]) {
				     if(!isSpecialNode(robot)) {
					 if(robots.length == 0 || robots.includes(robot)) {
					     for(var competition in data[year][robot]) {
						 if(!isSpecialNode(competition)) {
						     if(!competitions.includes(competition)) {
							 competitions.push(competition);
						     }
						 }
					     }
					 }
				     }
				 }
			     }
			 }
		     }
		     callback(competitions.sort());
		 });
}

//
// databaseGetMatches() - get a list of the matches for the given
//                             year, robot, and competition.
//
function databaseGetMatches(years,robots,competitions,callback)
{
    databaseLoad(false,
		 (snapshot) => {
		     var data = snapshot.val();
		     var matches = [];
		     for(var year in data) {
			 if(years.length == 0 || years.includes(year)) {
			     if(!isSpecialNode(year)) {
				 for(var robot in data[year]) {
				     if(!isSpecialNode(robot)) {
					 if(robots.length == 0 || robots.includes(robot)) {
					     for(var competition in data[year][robot]) {
						 if(!isSpecialNode(competition)) {
						     if(competitions.length == 0 || competitions.includes(competition)) {
							 for(var match in data[year][robot][competition]) {
							     if(!isSpecialNode(match)) {
								 if(!matches.includes(match)) {
								     matches.push(match);
								 }
							     }
							 }
						     }
						 }
					     }
					 }
				     }
				 }
			     }
			 }
		     }
		     callback(matches.sort((a,b)=>a-b));
		 });
}
