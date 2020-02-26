//
// calcMetaData.js
//
//   This file implements all of the statistics calculations.
//

const functions = require('firebase-functions');
var firebase = require('firebase');
require('firebase/storage');            // extremely important! (firebase must exist)


var combineDelta = require('./combineDelta');

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

module.exports = {
    calcMetaData: function (data,params,xmldata) { return(calcMetaData(data,params,xmldata));},
    calcMetaDataUpper: function (data,metaData,ref) { return(calcMetaDataUpper(data,metaData,ref));},
    calcMetaDataSpecific: function (metaData,perspective,ref) { return(calcMetaDataSpecific(metaData,perspective,ref));}
};


//
// calcMetaData() - given the current snapshot of data in the database, along
//                  with the xml data (driving creation of metadata) compute
//                  that metadata, and put it back into the object, returning
//                  it when done.  "params" has the year/robot/competion/match
//                  object.
//
function calcMetaData(data,params,metaData)
{
    for(var i=0; i < metaData.length; i++) {
//	console.log("Processing: " + metaData[i].name);
//	console.log(metaData[i]);
	data[metaData[i].name] = calcMetaDataField(data,params,metaData[i]);
     
    }

    return(data);
}

//
// calcMetaDataSpecific() - given a particular level, calculate the metaData
//                          FOR THAT LEVEL. Note that the ref must be pointing
//                          to something at that level...or this simply won't
//                          work right.
//
function calcMetaDataSpecific(metaDataSpec,perspective,ref)
{
    return(
	ref.once('value')
//	    .then((snapshot) => { console.log("running on " + perspective); return(snapshot); })
	    .then((snapshot) => upperMetaData(metaDataSpec,perspective,snapshot.val()))
            .then((metaData) => ref.child(METADATA).set(metaData))
    );
}
    

//
// calcMetaDataUpper() - calculate the metaData for all perspectives BUT the
//                       match.  Incoming data is the ENTIRE DATABASE. After
//                       changes, the entire database is returned to be written
//                       back.
//
//                       This routine USED to send back the changed database, and
//                       the whole thing would be slammed back into the database.
//                       but this caused a cascade of updates for matches. So now
//                       the changes are done directly given the "ref".
//
function calcMetaDataUpper(data,metaDataSpec,ref)
{
    // now, cruise through the data updating things...

    for(var year in data) {
	if(!isSpecialNode(year)) {
	    for(var robot in data[year]) {
		if(!isSpecialNode(robot)) {
		    for(var competition in data[year][robot]) {
			if(!isSpecialNode(competition)) {
			    data[year][robot][competition][METADATA] =
				upperMetaData(metaDataSpec,"competition",data[year][robot][competition]);
//			    console.log(data[year][robot][competition][METADATA]);
			    ref.child(year).child(robot).child(competition).child(METADATA)
				.set(data[year][robot][competition][METADATA]);
			}
		    }
		    data[year][robot][METADATA] = upperMetaData(metaDataSpec,"robot",data[year][robot]);
		    ref.child(year).child(robot).child(METADATA).set(data[year][robot][METADATA]);
		}
	    }
	    data[year][METADATA] = upperMetaData(metaDataSpec,"year",data[year]);
	    ref.child(year).child(METADATA).set(data[year][METADATA]);
	}
    }

    // this may not be a thing...but what the heck
    data[METADATA] = upperMetaData(metaDataSpec,"top",data);
    ref.child(METADATA).set(data[METADATA]);

    return(data);
}

//
// upperMetaData() - calculate the upper metaData (that above match). The new metaData is returned.
//                   The perspective is "year", "robot", or "competition", and the data needs to be
//                   the data object for that thing at that perspective, like:
//
//                        data[year][robot][competition]
//
function upperMetaData(metaDataSpec,perspective,data)
{
    var localData = {};            // used to accumulate the "input" data for the metaData calculations
    var newMetaData = {};          // all new metaData is stored here for later return

    // first, get all of the data for all lower layers

    for(var lowerLevel in data) {
	if(!isSpecialNode(lowerLevel)) {

	    // if the lower level has METADATA use it
	    if(data[lowerLevel].hasOwnProperty(METADATA)) {
		dataMerge(localData,data[lowerLevel][METADATA]);
	    }

	    // if we are a the competition level, use ALL lower-level match data
	    if(perspective == "competition") {
		dataMerge(localData,data[lowerLevel]);
	    }
	}
    }

    // and then process it all, if there is anything to do

    if(metaDataSpec.hasOwnProperty(perspective)) {
	for(var i=0; i < metaDataSpec[perspective].length; i++) {
	    var metaTarget = metaDataSpec[perspective][i];
//	    console.log("Processing: " + metaTarget.name);
	    var meta = calcMetaDataField(localData,{},metaTarget);
	    localData[metaTarget.name] = meta;
	    newMetaData[metaTarget.name] = meta;
	}
    }

    return(newMetaData);
}

//
// dataMerge() - given a target object, and an additional object, merge
//               them together, returning the target object with the other
//               merged in.
//
function dataMerge(target,additional)
{
    for(var add in additional) {
	if(target.hasOwnProperty(add)) {
	    target[add].push(additional[add]);
	} else {
	    target[add] = [additional[add]];
	}
    }

    return(target);
}

//
// calcMetaDataField() - given the set of data (which is updated as metaData
//                       is created). NOTE that javascript passes objects as
//                       "pass by reference" so the "data" object will be
//                       changed in place. The given field is the metaData
//                       field that needs to be calculated.
//          RETURNS: the value that should be associated with the metaData
//                   field in the database.
//
function calcMetaDataField(data,params,field)
{
    var operation = field.op;

    switch(operation) {
    case 'count':       return(calcMetaDataField_count(data,params,field));
    case 'average':     return(calcMetaDataField_average(data,params,field));
    case 'combine':     return(calcMetaDataField_combine(data,params,field));
    case 'delta':       return(calcMetaDataField_delta(data,params,field,false));
    case 'delta2':      return(calcMetaDataField_delta(data,params,field,true));
    case 'sum':         return(calcMetaDataField_sum(data,params,field));
    case 'subtract':    return(calcMetaDataField_subtract(data,params,field));	
    case 'percent':     return(calcMetaDataField_percent(data,params,field));
    case 'divide':      return(calcMetaDataField_divide(data,params,field));
    case 'multiply':    return(calcMetaDataField_multiply(data,params,field));	
    case 'weight':      return(calcMetaDataField_weight(data,params,field));
    case 'contains':    return(calcMetaDataField_contains(data,params,field));
    case 'containsAny': return(calcMetaDataField_containsAny(data,params,field));
    case 'min':         return(calcMetaDataField_min(data,params,field));
    case 'max':         return(calcMetaDataField_max(data,params,field));
    case 'defEffect':   return(calcMetaDataField_defEffect(data,params,field));
    case 'compare':     return(calcMetaDataField_compare(data,params,field));
    case 'constant':    return(calcMetaDataField_constant(data,params,field));
    case 'assign':      return(calcMetaDataField_assign(data,params,field));
    case 'flatten':     return(calcMetaDataField_flatten(data,params,field));
    default:         console.log("BAD OP: " + operation); return(false);
    }

}

//
// calcMetaDataField_<operation>() - each of the following functions calculate
//                                    the indicated operation on the incoming
//                                    data. NOTE - the data is NOT changed at
//                                    this level, it is just computed. It is
//                                    well above where the data is updated.
//

//
// _weight() - given target target(s) with targetVal(s), compute a weighted
//             sum of the target(s). Each target is multiplied by the targetVal
//             and then added to the sum. The sum is the value of the field.
//
function calcMetaDataField_weight(data,params,field)
{
    var targets = field.target;
    var multipliers = field.multiplier;

    // high/low are optional for weights - if not specified, then they
    // default to low=0 and high=1 - which causes the multiplier to be
    // the only factor

    // BIG NOTE - due to the current organization of the XML, the high/low
    //  is array that is "normally" positionally connected to the fields
    //  that are specified.  HOWEVER, if one of the fields doesn't use a
    //  high/low then the positions are off, and this doesn't work well.
    //  The BEST thing to do is to either don't specify ANY highs/lows
    //  or to specify a high and low for everything.

    var lows = [];
    if(field.hasOwnProperty("low")) {
	lows = field.low;
    }

    var highs = [];
    if(field.hasOwnProperty("high")) {
	highs = field.high;
    }

    // targets/targetVals should always be arrays, but just in case...

    if (!Array.isArray(targets)) { targets = [targets]; }
    if (!Array.isArray(multipliers)) { multipliers = [multipliers]; }
    if (!Array.isArray(lows)) { lows = [lows]; }
    if (!Array.isArray(highs)) { highs = [highs]; }

    // process each of the targets summing the output
    //   The targets are our driver - if there are more multipliers/lows/highs
    //   than targets, the remaining multipliers/lows/highs are ignored. If there
    //   are more targets than the multipliers/lows/highs, the missing:
    //   multipliers are assumed to be 1, the min is 0, and max 1.

    for(var i=0; i < (targets.length - multipliers.length); i++) {
	multipliers.push(1);
    }
    for(var i=0; i < (targets.length - lows.length); i++) {
	lows.push(0);
    }
    for(var i=0; i < (targets.length - highs.length); i++) {
	highs.push(1);
    }

    // IMPORTANT NOTE - this code doesn't support targets being an
    //                  ARRAY of ARRAYS - so you can't do a "weight"
    //                  op above the match level...it will fail.

    // note that if a target doesn't exist in the data, then it is
    // quietly ignored

    var sum = 0;
    for(var i=0; i < targets.length; i++) {
	var item = normalizeDataItem(data,targets[i]);

	if(item.length >= 1) {

	    var targetValue = Number.parseFloat(item[0]);            // use the first value only
	    var multiplier = Number.parseFloat(multipliers[i]);
	    var high = Number.parseFloat(highs[i]);
	    var low = Number.parseFloat(lows[i]);
	    var inverted = false;

	    if(Number.isNaN(targetValue)) {
		console.log("Bad value for " + targets[i]);
		continue;     // skip bad values or multipliers
	    }
	    if(Number.isNaN(multiplier)) {
		console.log("Bad multiplier for " + targets[i] + "(" + multiplier[i] + ")");
		continue;
	    }
	    if(Number.isNaN(high)) {
		console.log("Bad high for " + targets[i] + "(" + highs[i] + ")");
		continue;
	    }
	    if(Number.isNaN(low)) {
		console.log("Bad low for " + targets[i] + "(" + lows[i] + ")");
		continue;
	    }

	    if(high < low) {     // if the high is smaller, then we are "inverted"
		var temp = low;  // flip the values to be numerically high/low
		low = high;
		high = temp;
		inverted = true;
	    }

	    var range = high-low;
	    var offsetValue = targetValue-low;
	    var normalValue = offsetValue/range;

	    if(inverted) {
		sum += (1-normalValue)*multiplier;
	    } else {
		sum += normalValue*multiplier;
	    }
	}
    }

    return(sum);
}

//
// normalizeDataItem() - Given a particular data item (from Firebase), normalize it
//                       into an array of values. This deals with things like
//                        hasOwnProperty() and null values.
//
//     RETURNS - an array is ALWAYS returned - if the data item had one item, then the array
//               has one item - if the field doesn't exist or is null, then an empty array
//               is returned.
//
function normalizeDataItem(data,fieldName)
{
    var returnArray = [];      // empty array returned for no field or null value

    // make sure the target field exists and is non-null

    if(data.hasOwnProperty(fieldName) && data[fieldName] !== null) {

	// check to see if it is an object (multiple values)
	//  (normally you'd need to check for null, because null also has typeof 'object'
	//    but we already checked for null above)
	
	if(typeof data[fieldName] === 'object') {
	    for(var prop in data[fieldName]) {
		if(data[fieldName].hasOwnProperty(prop)) {
		    returnArray.push(data[fieldName][prop]);
		}
	    }
	} else {
	    returnArray.push(data[fieldName]);    	    // single value
	}
    }
    return(returnArray);
}

//
// _flatten() - operation that 'flattens' its field, that is,
//              instead of a 2-member array with two arrays
//              as its elements, crack-open the two arrays and
//              create a new array with all of the members of
//              the two arrays.
//
//              For example:
//                     A = [ 10, 20, 30, 40 ]
//                     B = [ 6, 7, 8, 9, 10 ]
//                     C = [ A, B, 50 ]
//                     flatten(C) = [ 10, 20, 30, 40, 6, 7, 8 , 10, 50 ]
//
//              There are numerous rules for flatten:
//                - it takes one or more target(s)
//                - it is expected that each target is an array
//                - if a target is NOT an array, then it is treated
//                   as an array with a single member
//                - if a target is null/undefined/NaN, then it is ignored completely
//                - the output is ALWAYS an array
//
function calcMetaDataField_flatten(data,params,field)
{
    var retArray = [];

    if(!field.hasOwnProperty('target')) {
	console.log('flatten in field ' + field.name + ' missing target (empty array returned)');
    } else {

	// if target exists, it will be an array of targets (at least one)
	for(var i=0; i < field.target.length; i++) {

	    let item = normalizeDataItem(data,field.target[i]);   	// item is normalized into array of values
	    //    for the given field (may be zero length)
	    if(item.length != 0) {
		for(var j=0; j < item.length; j++) {

		    // flatten is often used for higher-level metadata, where the fields
		    //   of lower-levels are combined into an array by this machinery.
		    //   In this case, we can arrays of arrays for things like events,
		    //   or arrays of arrays of objects for things like imagemap points.

		    if(Array.isArray(item[j])) {                          // flatten FIRST array level if it exists
			for(var k=0; k < item[j].length; k++) {
			    retArray.push(item[j][k]);
			}
		    } else {
			retArray.push(item[j]);                    // otherwise, just use the current item
		    }
		}
	    }
	}
    }
       
    return(retArray);
}
    

//
// _assign() - operation that simply assigns one field to another.
//             This is particularly useful in upper level metaData
//             where you want to take advantage of the merging of
//             the data in lower levels, and simply replicate the
//             data name.
//
function calcMetaDataField_assign(data,params,field)
{
    // only one target field is used. Note that there is data normalization
    // that occurs, causing the assignment to always have something.  But
    // the rules are slightly different.
    //
    //   target doesn't exist   ==> null
    //   target = null ==> null
    //   target = single value  ==> single value (as opposed to normalized array)
    //   target = anything else   ==> exact value of target
    //
    
    if(!field.hasOwnProperty('target')) {
	console.log('assignment in field ' + field.name + ' missing target');
    } else {
	var item = normalizeDataItem(data,field.target[0]);

	if(item.length < 1) {
	    item = null;
	} else if(item.length == 1) {
	    item = item[0];
	}
    }

    return(item);
}

//
// _constant() - operation that simply uses the given target as a literal.
//               That is, the target IS NOT another field, it is instead
//               something like a string or a number.
//
function calcMetaDataField_constant(data,params,field)
{
    var retval = null;

    // if there is no target field => null
    // if there is a target field that was not processed as an array => target.field
    // if there is a target field as array, length 0 => null
    // if there is a target field as array, length 1 => target.field[0]
    // if there is a target field as array, length >1 => target.field

    if(field.hasOwnProperty('target')) {
	if (Array.isArray(field.target)) {
	    if(field.target.length == 1) {
		retval = field.target[0];
	    } else if(field.target.length > 1) {
		retval = field.target;
	    }
	} else {
	    retval = field.target;
	}
    }

    return(retval);
}    

function calcMetaDataField_count(data,params,field)
{
    var targets = field.target;           // name of the data field to count

    if (!Array.isArray(targets)) {
	targets = [targets];
    }

    var count = 0;

    for(var i=0; i < targets.length; i++) {
	if(data.hasOwnProperty(targets[i])) {    // make sure the target field exists
	    if(typeof data[targets[i]] === 'object' && data[targets[i]] !== null) {
		for(var prop in data[targets[i]]) {
		    if(data[targets[i]].hasOwnProperty(prop)) {
			count++;
		    }
		}
	    } else {
		count++;
	    }
	}
    }

    return(count);
}

function calcMetaDataField_sum(data,params,field)
{
        var target = field.target;           // name of the data field to count

	var ourTargets;

	if (Array.isArray(target)) {
	    ourTargets = target;
	} else {
	    ourTargets = [target];
	}

	var sum = 0;
	
	for (var i = 0; i<ourTargets.length; i++) {

	    if(data.hasOwnProperty(ourTargets[i])) {    // make sure the target field exists

		// process arrays of things
		if(typeof data[ourTargets[i]] === 'object' && data[ourTargets[i]] !== null) {
		    for(k in data[ourTargets[i]]) {
			if(data[ourTargets[i]].hasOwnProperty(k)) {
			    let targetVal = parseInt(data[ourTargets[i]][k]);
			    if(isNaN(targetVal)) {
				targetVal = 0;
			    }
			    sum += targetVal;
			}
		    }

		// otherwise, just a value
       		} else {
		    let targetVal = parseInt(data[ourTargets[i]]);
		    if(isNaN(targetVal)) {
			targetVal = 0;
		    }
		    sum += targetVal;
		}
	    }
	}	
	return(sum);

}

//
// _subtract() -Calculate a number based off subtracting right from left
//              NOTE: you can only have 2 values, one left which
//                    will be subtracted by the right
//
function calcMetaDataField_subtract(data,params,field)
{
    // only use the first numerator & denominator

    var left = field.target[0];          // these are always arrays coming in
    var right = field.target[1];

    var dataL = normalizeDataItem(data,left);
    var dataR = normalizeDataItem(data,right);

    if(dataL.length == 0 || dataR.length == 0){
	console.log("One of your targets had no data in it")
	return null;
    }
    
    var value = dataL[0]-dataR[0];

    return(value);
}


function calcMetaDataField_combine(data,params,field)
{
    var target = field.target;           // name of the data field to count

    var ourTargets;

    if (Array.isArray(target)) {
	ourTargets = target;
    } else {
	ourTargets = [target];
    }

    var x = [];
    for (var i = 0; i<ourTargets.length; i++) {

	    if(data.hasOwnProperty(ourTargets[i])) {    // make sure the target field exists
		if(typeof data[ourTargets[i]] === 'object' && data[ourTargets[i]] !== null) {
		    x = combineDelta.combineOP(x,data[ourTargets[i]]);
		}
	    }
    }

    return(x);
}

//
// _delta() - create a time-delta array from the named fields (start and end).
//            Do a "strict" delta if strict is given as true.
//            (see file:combineDelta.js for more information)

function calcMetaDataField_delta(data,params,field,strict)
{
    var start = field.start[0];    // only use the first field of start/end
    var end = field.end[0];

    // if the start or end fields aren't there, default them to empty

    startVal = [];
    if(data.hasOwnProperty(start)) {
	startVal = data[start];
    }

    endVal = [];
    if(data.hasOwnProperty(end)) {
	endVal = data[end];
    }
           
    var delta = combineDelta.deltaOP(startVal,endVal,strict);
    return(delta);
}

function calcMetaDataField_average(data,params,field)
{
    var target = field.target;           // name of the data field to count

    var ourTargets;

    if (Array.isArray(target)) {
	ourTargets = target;
    } else {
	ourTargets = [target];
    }

    var sum = 0.0;
    var count = 0.0;

    for (var i = 0; i<ourTargets.length; i++) {

	if(data.hasOwnProperty(ourTargets[i])) {    // make sure the target field exists
	    if(typeof data[ourTargets[i]] === 'object' && data[ourTargets[i]] !== null) {
		for(k in data[ourTargets[i]]) {
		    if(data[ourTargets[i]].hasOwnProperty(k)) {
			if(data[ourTargets[i]][k] !== null) {
			    sum += parseFloat(data[ourTargets[i]][k]);
			    count++;
			}
		    }
		}
	    } else {
		if(data[ourTargets[i]] !== null) {
		    sum += parseFloat(data[ourTargets[i]]);
		    count++;
		}
	    }
	}
    }	

    // we have to protect ourselves here, if there is NO data, then count is zero
    //   and this causes avg to be NaN (can't divide by zero).  If this is the case,
    //   simply return null.

    if(count == 0) {
	return(null);
    } else {
	return(sum/count);
    }
}

//
// _percent() - calculate the percentage of targets that have the given targetVal
//              in the data. Note that the comparison to the target/targetVal is
//              done WITHOUT parsing - that is, as a string.
//              Multiple targetVals are used in an OR fashion.  That is, the
//              percent is calculated based upon if the value is THIS or THAT.
//
function calcMetaDataField_percent(data,params,field)
{
    // only use the first target & targetVal

    var target = field.target[0];          // these are always arrays coming in
    var targetVals = field.targetVal;

    var dataTarget = normalizeDataItem(data,target);
    var percent = 0;

    if(dataTarget.length) {
	var count = 0;
	for(var i=0; i < dataTarget.length; i++) {
	    for(var j=0; j < targetVals.length; j++) {
		if(dataTarget[i] == targetVals[j]) {
		    count++;
		    break;      // don't allow double counting if the same targetVal
		}               //   is used multiple times
	    }
	}
	percent = (count/dataTarget.length) * 100;
    }

    return(percent);
}

//
// _divide() -  Calculate a float based on the two inputted targets:
//              <Numerator> and <Denominator>.
//              NOTE: you can only have 2 values, one numerator which
//                    will be divided by one denominator
//
function calcMetaDataField_divide(data,params,field)
{
    if(field.target.length < 2){
	console.log("You must have atleast 2 targets to divide");
	return null;
    }
    
    // only use the first numerator & denominator

    var numerator = field.target[0];
    var denominator = field.target[1];

    var dataNum = normalizeDataItem(data,numerator);
    var dataDenom = normalizeDataItem(data,denominator);

    if(dataNum.length == 0 || dataDenom.length == 0){
	console.log("Your Denominator and or Numerator had no data in it")
	return null;
    }

    if(dataDenom == 0){
	console.log("denominator was 0 in divide for " + field.name);
	return(dataNum[0]);
    }
    
    var value = dataNum[0]/dataDenom[0];

    return(value);
}

//
// _multiply() -Calculate a number by multiplying the two targetstted targets:
//              NOTE: you can have as many targets as you want
//
function calcMetaDataField_multiply(data,params,field)
{
    if(field.target.length == 0){
	console.log("no fields were given to multiply by");
	return(0);
    }
    
    // grab the first element (because i could set this to 1 or 0, but then either
    // the product would always be 0, or a return of 1 would come back on an unseccessful multiplication)
    var product = normalizeDataItem(data,field.target[0]);

    // now we need to check if the product we start with is an array with a length greater than 1, we will also do this in the loop
    if(product.length > 1){
	console.log("Cannot multiply by an array (this is likely a list of events)");
	return null;
    }
    
    var nextNum;

    // for each target multiply the current product by the next target field
    for(var i = 1; i < field.target.length; i++){
	nextNum = normalizeDataItem(data,field.target[i]);
	// if our next num is an array with length greater than 1 we can't multiply, return null
	if(nextNum.length > 1){
	    console.log("Cannot multiply by an array (this is likely a list of events)");
	    return null;
	}
	product = product * parseFloat(nextNum[0]);    // ensure that we're working with a number
    }
    
    return(product);
}

//
// _contains() - used to see if a data element (array) contains a particular
//               value. Returns 1 if so, 0 otherwise. If there are multiple values
//               ALL must be contained for the contains to be true.  Comparison is
//               done by string.
//     This could really be called "containsAll"
//
function calcMetaDataField_contains(data,params,field)
{
    var target = field.target[0];          // these are always arrays coming in
    var targetVals = field.targetVal;

    var dataTarget = normalizeDataItem(data,target);

    for(var i=0; i < targetVals.length; i++) {
	if(!dataTarget.includes(targetVals[i])) {
	    return(0);       // if ANY don't match, then we don't match
	}
    }

    return(1);
}

//
// _containsAny() - used to see if a data element (array) contains a particular
//                  value. Returns 1 if so, 0 otherwise. If there are multiple values
//                  all must be contained for the contains to be true.  Comparison is
//                  done by string.
//
function calcMetaDataField_containsAny(data,params,field)
{
    var target = field.target[0];          // these are always arrays coming in
    var targetVals = field.targetVal;

    var dataTarget = normalizeDataItem(data,target);

    var found = false;
    for(var i=0; i < targetVals.length; i++) {
	if(dataTarget.includes(targetVals[i])) {
	    found = true;                        // if ANY match, we're done
	    break;
	}
    }

    return(found?1:0);
}

//
// _min() - Loops through every value of the given field
//          and returns the lowest value.
//
function calcMetaDataField_min(data,params,field)
{
    var target = field.target[0];          // these are always arrays coming in

    var dataTarget = normalizeDataItem(data,target);
    var min = null;

    for(var i=0; i < dataTarget.length; i++) {
	var thisNumber = parseFloat(dataTarget[i]);
	if(min===null || thisNumber < min){
	    min = thisNumber;
	} 
    }

    return(min);
}

//
// _max() - Loops through every value of the given field
//          and returns the highest value.  Note that these
//          routines operate on NUMBERS, so strings will
//          confuse them, if it weren't for parseFloat()!
//
function calcMetaDataField_max(data,params,field)
{
    var target = field.target[0];          // these are always arrays coming in

    var dataTarget = normalizeDataItem(data,target);
    var max = null;

    for(var i=0; i < dataTarget.length; i++) {
	var thisNumber = parseFloat(dataTarget[i]);
	if(max===null || thisNumber > max){
	    max = thisNumber;
	} 
    }

    return(max);
}

//
// _compare() - Compare 2 field values using a given
//              operation.
//
function calcMetaDataField_compare(data,params,field)
{
    var returnVal;
    var target = field.target[0];          // these are always arrays coming in
    var target2 = field.target[1];
    var ltVal = "Less Than";              // These are the default values for when no value is entered
    var gtVal = "Greater Than";
    var eqVal = "Equal";

    // go ahead and reassign the targets
    target = normalizeDataItem(data,target)[0];
    target2 = normalizeDataItem(data,target2)[0];

    if(field.hasOwnProperty('ltVal')){
	ltVal = field.ltVal;
    }
    
    if(field.hasOwnProperty('gtVal')){
	gtVal = field.gtVal;
    }
    
    if(field.hasOwnProperty('eqVal')){
	eqVal = field.eqVal;
    }
    
    if(target<target2){
	returnVal = ltVal;
    } else if(target>target2){
	returnVal = gtVal;
    } else if(target==target2){
	returnVal = eqVal;
    } else{
	returnVal = null;
    }

    return (returnVal);
}


//
// _defEffect() - calculates the difference between a target robot's data value
//                in a match at the competition level and the current match's data value. The
//                current match has both the target robot and the robot whose defense effect is being 
//                being measured.
//
// ex: Measuring the defensive effect that 2468 has on team 1234 (defensiveTeamNum1) in match 1 for number of objects scored
//   <metaData>
//       <name>defensiveTeamNum1Effect</name>              <-- (-): 2468 bad at defense (+):2468 good at defense (0):2468 has no effect on 1234 scoring
//       <op>defEffect</op>
//       <target>defensiveTeamNum1</target>                <--robot who defense was played against
//       <target2>objectsScoredTotalAverage</target2>      <--competition level average total objects scored for 1234
//       <target3>objectsScoredTotal</target3>             <--match 1 total objects scored for 1234
//       ...
//   </metaData>    
//
function calcMetaDataField_defEffect(data,params,field)
{
    console.log('hello');

    var targetRobot = field.target[0];
    var compLevelValue = field.target[1];
    var matchLevelValue = field.target[2];

    var dataTargetRobot = normalizeDataItem(data,targetRobot);

    //if there is no data in the field, we can't do anything
    if (dataTargetRobot.length == 0) {
	return null;
    }

    console.log('We are still here');

    // gets the first value of the target field
    dataTargetRobot = dataTargetRobot[0].trim();


    var targetRef = '/' + params.year +
	'/' + dataTargetRobot + 
	'/' + params.competition + 
	'/' + params.match;

    var compLevelValueDataGlobal;
    
    var retVal = 0;
    retVal = firebase.database().ref(targetRef).once("value")
	
	// if this reference doesn't exist, then the named robot wasn't in this match

	// gets the field value named by the second target from the named robot's competition metaData 
        .then((snapshot) => {

		console.log('after first database access');
	   var compLevelValueRef = '/' + params.year + 
	   '/' + dataTargetRobot + 
	   '/' + params.competition + 
	   '/' + '_metaData' + 
	   '/' + compLevelValue;
	
	   return firebase.database().ref(compLevelValueRef).once("value");
	 })	
	    
	.then((snapshot) => {
		return snapshot.val();
	    })

	// gets the field value named by the second target from the named robot's match data		
	.then((compLevelValueData) => {

		console.log('after second database access');

		compLevelValueDataGlobal = compLevelValueData;
		var matchLevelValueRef = targetRef + '/' + matchLevelValue;
	
		return firebase.database().ref(matchLevelValueRef).once("value");
	    })

	.then((snapshot) => {
		return snapshot.val();
	    })

	.then((matchLevelValueData) => {

	    console.log('after third database access');
	    var v = compLevelValueDataGlobal - matchLevelValueData;
	    return(v);
	    })
		    
        .catch((error) => {
	    console.log('in the catch');
	    return(null);
	    });

    return retVal;
}
