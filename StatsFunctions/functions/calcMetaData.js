//
// calcMetaData.js
//
//   This file implements all of the statistics calculations.
//

var combineDelta = require('./combineDelta');


module.exports = {
    calcMetaData: function (data,params,xmldata) { return(calcMetaData(data,params,xmldata));}
};


//
// calcMetaData() - given the current snapshot of data in the database, along
//                  with the xml data (driving creation of metadata) compute
//                  that metadata, and put it back into the object, returning
//                  it when done.  "params" has the year/robot/competion/match
//                  object.
//
function calcMetaData(data,params,xmldata)
{
    // the xmldata object includes a "metaData" property that is an ordered array
    //   of new fields that need to be created, based upon previous data.

    var metaData = xmldata.metaData;

    for(var i=0; i < metaData.length; i++) {
	console.log("Processing: " + metaData[i].name);
	data[metaData[i].name] = calcMetaDataField(data,params,metaData[i]);
    }

    return(data);
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
    case 'count':    return(calcMetaDataField_count(data,params,field));
    case 'average':  return(calcMetaDataField_average(data,params,field));
    case 'combine':  return(calcMetaDataField_combine(data,params,field));
    case 'delta':    return(calcMetaDataField_delta(data,params,field));
    case 'sum':      return(calcMetaDataField_sum(data,params,field));
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

function calcMetaDataField_count(data,params,field)
{
    var target = field.target;           // name of the data field to count

    if(data.hasOwnProperty(target)) {    // make sure the target field exists
	if(typeof data.target === 'object' && data.target !== null) {
	    var count = 0;
	    for(k in data.target) {
		if(data.target.hasOwnProperty(k)) {
		    count++;
		}
	    }
	    return(count);
	}
	return(1);
    }

    return(0);
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
		if(typeof data[ourTargets[i]] === 'object' && data[ourTargets[i]] !== null) {
		    for(k in data[ourTargets[i]]) {
			if(data[ourTargets[i]].hasOwnProperty(k)) {
			    sum += parseInt(data[ourTarget[i]][k]);
			}
		    }
       		} else {
		    sum += parseInt(data[ourTargets[i]]);
		}
	    }
	}	
	return(sum);

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
		    console.log(data[ourTargets[i]]);
		    x = combineDelta.combineOP(x,data[ourTargets[i]]);
		}
	    }
    }
    console.log(x);
    return(x);
}

function calcMetaDataField_delta(data,params,field)
{
    var start = field.start;           // name of the data field to count
    var end = field.end;
    var delta = combineDelta.deltaOP(data[start],data[end]);
    return(delta);


}

function calcMetaDataField_average(data,params,field)
{
    return(-1);
}
