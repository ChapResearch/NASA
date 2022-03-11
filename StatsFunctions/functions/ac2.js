//
// ac2.js
//
//   New functions for the second year after covid.
//
//    geoSubset() - given heatmap data, extract a subset of it based upon
//         the provided geometry of a "target area".
//
//    difference() - analogous to combine(), but in reverse, return a
//         new event array after subtracting the second array from the
//         first.  Note that there can be more arrays after the
//         second, each of which will be subtracted from the
//         previously calculated difference.
//
//    correlate() - analogous to delta() (ish) compute the correlation of
//         a start event array and an end event array. The correlation is
//         based upon "clusters" of events, favoring the end events. In
//         other words, a single start event can have numerous end events.
//

module.exports = {
    geoSubsetOP: geoSubset,
    differenceOP: difference,
    correlateOP: correlate
};


//
// geoSubset() - given heatmap data (both the event array and the position
//      array), determine the subset of events that fit within the particular
//      area.  The area is defined by a specified shape logically positioned
//      within the heatmap (from 0 to 100 on both x and y).  Prototype:
//
//           subsetEventArray = geoSubset(eventArray,positionArray,geoSpec)
//
//      Where the 'eventArray' is the events from a heatmap, and the
//      'positionArray' is the positions from a heatmap. It is assumed that
//      these two arrays are of equal length and that they map 1-to-1.
//
//      The geoSpec is specified as a set of constants matching one of the
//      following patterns:
//
//               'rect',  x,y,w,h
//               'circle',x,y,rx,ry
//
//      Where x,y is the origin of the rectangle or circle.
//      w,h are the width and height of the rectangle.
//      rx and ry are the respective radii of the circle/ellipse
//            (rx,ry share the arg slots of w,h)
//
//      NOTE - if shape isn't recognized, then an empty array is returned.
//      NOTE - if x or y isn't specified, it defaults to zero
//      NOTE - if w or h aren't specified, they both default to 100
//      NOTE - if rx or ry aren't specified, they both default to 50
//
//      NOTE - x is inclusive, but x+w is exclusive
//      NOTE - rx,ry are exclusive
//
//      It is interesting to point out that if r is given as 100, the corners of the
//      heatmap are NOT part of that circle.
//
function geoSubset(eventArray,positionArray,shape,x,y,w,h)
{
    if(x === undefined) { x = 0; }
    if(y === undefined) { y = 0; }
    if(w === undefined) { w = 100; }
    if(h === undefined) { h = 100; }

    var outArray = [];

    var rx, ry;

    // just a bit of checking - bad args return empty array
    
    if(!Array.isArray(eventArray) || !Array.isArray(positionArray)) {
	return(outArray);
    }
        
    // quick pre-process of the shape to make later processing a bit easier

    switch(shape) {
    case 'rect':
	break;
    case 'circle':
	rx = w/2;
	ry = h/2
	break;
    default:
    	return(outArray);
    }

    for(var i=0; i < eventArray.length; i++) {
	var eventX = positionArray[i].x;
	var eventY = positionArray[i].y;
	
	switch(shape) {

	case 'rect':
	    if(eventX >= x && eventX < x+w && eventY >= y && eventY < y+h) {
		outArray.push(eventArray[i]);
	    }
	    break;

	case 'circle':

	    // thanks to https://math.stackexchange.com/questions/76457/check-if-a-point-is-within-an-ellipse
	    //   for the quick "inside the ellipse" formula
	    
	    var dx = eventX - x;
	    var dy = eventY - y;
	    var unitR = (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry);
	    if(unitR < 1) {
		outArray.push(eventArray[i]);
	    }
	    break;
	}
    }

    return(outArray);
}
    

//
// difference() - subtract one event array from another, or if more than 2 arguments are
//      given, subtract all of the arguments from the first.  Prototype:
//
//          returnArray = difference(A,B,C...)
//
//      Where A, B, C (and any more arguments) are all event arrays.
//
//      This function will remove any matching events in B from A. Then, the events
//      from C will be removed from that result, and so on.
//
//      Note that repeated event times are NOT removed en masse. For example, if
//      A = [ 1, 2, 3, 3, 4] and B = [ 2,3 ], then the result is [1,3,4].
//
//      NOTE - if A is the only array provided, it is returned as a whole.
//      NOTE - if A isn't provided, then an empty array is returned.
//      NOTE - non-array arguments are silently skipped
//
function difference(Aincoming)
{
    var A = [...Aincoming];
    
    if(A === undefined || !Array.isArray(A)) {
	return([]);
    }

    for(var i=1; i < arguments.length; i++) {
	if(!Array.isArray(arguments[i])) {
	    continue;
	}
	for(var j=0; j < arguments[i].length; j++) {
	    var index =	A.findIndex((x) => x==arguments[i][j]);
	    if(index >= 0) {
		A.splice(index,1);
	    }
	}
    }

    return(A);
}

//
// correlate() - compute the correlation of start-events to end-events,
//      based upon "clusters" of events. This routine is coded to "favor"
//      the end-events, in other words, a single start-event can have
//      multiple end-events.
//
//      The original "somewhat like" function is delta(), which would
//      calculate the time delta between correlated events, where the
//      "correlation" was based upon "nearest time".  An end-event would
//      be correlated with the start-event that was the nearest time
//      less than the end-event. The routine would return an array of
//      the time deltas between correlated events.
//
//      This routine, on the other hand, only returns the events (no
//      deltas) within the end-events that are correlated to the given
//      start events.  It is used, primarily to create groups of related
//      events.  For example:
//
//           A-start-events = [ 10, 20, 30 ]
//           B-start-events = [ 5, 17, 45 ]
//           C-end-events = [ 11, 13, 19, 20, 31, 32 ]
//           D-end-events = [ 12, 18, 22 ]
//
//           AC-events = correlate(A,C,D)
//           AD-events = correlate(A,D,C
//
//           AC-events == [ 11, 13, 20, 31, 32 ]
//           AD-events == [ 12, 22 ]
//
//      The prototype of the function is:
//
//            out = correlate(startEvents,endEvents,otherStartEvents,...)
//
//      The "otherStartEvents" can be unspecified or empty, and there can
//      be many.  Upon invocation, all of the otherStartEvents are combined
//      with the startEvents, and serve to help cluster events.
//      
//      The way to think of this example is: find "all of the events
//      that started with an A event and ended with a C event", and
//      "all of the events that started with an A event and ended with
//      a D event".
//
//      NOTE - if either no startEvents or endEvents are given, or
//             either is an empty array, then this call will return an
//             empty array.
//      NOTE - it is OK for the otherEndEvents arrays to have the
//             given startEvents included within them.
//      NOTE - it is assumed that all event arrays are SORTED
//      NOTE - equal times are "swallowed" - it is impossible to know
//             what event *actually* occurred first when the times are
//             equal. Further, there is no useful deterministic way to
//             favor one set of events over another (easily). Therefore,
//             equal times are always swallowed.
//      
function correlate(startEvents,endEvents)    // OTHER ARGUMENTS ARE POSSIBLE
{
    if(startEvents === undefined || !Array.isArray(startEvents) ||
       endEvents === undefined || !Array.isArray(endEvents)) {
	return([]);
    }

    // First, create a master startEvents list by combining all of the
    //   startEvents together, and sorting them.  Note that events that
    //   have the same time are "swallowed" - because there is no way
    //   to differentiate between them. This means that even if the
    //   startEvents are duplicated in the list of otherStartEvents it
    //   simply doesn't matter.

    var allStartEvents = startEvents;

    for(var i=2; i < arguments.length; i++) {
	if(Array.isArray(arguments[i])) {
	    allStartEvents = allStartEvents.concat(arguments[i]);
	}
    }

    allStartEvents.sort(function(a, b){return b - a});     // sorted in REVERSE

    // now cruise through the target startEvents, identifying and tracking
    //   the endEvents that are in the "cluster" from one start event to
    //   another.

    var outEvents = [];

    for(var i=0; i < startEvents.length; i++) {

	// if there are events of the same time, move to the last one
	if(i < (startEvents.length - 1) && startEvents[i] == startEvents[i+1]) {
	    continue;
	}

	var clusterStart = startEvents[i];
	var clusterEnd = null;                    // null means "to the end"

	for(var j=0; allStartEvents[j] > clusterStart; j++ ) {
	    clusterEnd = allStartEvents[j];
	}

	// now we have the start of the cluster, and either the end of the cluster
	//   or null, meaning we are at the end of all start events. So now, go
	//   get the endEvents within that cluster.

	for(var j=0; j < endEvents.length; j++) {
	    if(endEvents[j] >= clusterStart && (clusterEnd === null || endEvents[j] < clusterEnd)) {
		outEvents.push(endEvents[j]);
	    }
	}
    }

    return(outEvents);
}

