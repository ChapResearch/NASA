//
// calcMetaData.js
//
//   This file implements all of the statistics calculations.
//

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
    return(2);
}

