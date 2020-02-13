//
// CURRENT_VIEW - either null if there is no current view, or an object with:
//
//        { name:"", headers:[col], data:[row[col]], dataTypes:[col], sort:[col] }
//
//             headers[]  - the string headers for each column
//             data[][]   - the data it will be justified based upon the dataType
//             dataType[] - either 'number' or 'string'
//             sort[]     - either 'ASC' or 'DESC' (like SQL!) or 'none'.
//             sortType[] - an override for the sort type (optional)
//             format[]   - format instructions
//
var CURRENT_VIEW = {};

//
// VIEW_DATA - the object that represents all of the potential views of scouting
//             data. Note that indexing by name gives all view data for that view.

var VIEW_DATA = null;

//
// This is a list of possible constraints, in order from "left to right"
// The constraints to the left are broader than those on the right.
//
var ALL_CONSTRAINTS = [{constraint:'year',indicator:'Y'},
		       {constraint:'robot',indicator:'R'},
		       {constraint:'competition',indicator:'C'},
		       {constraint:'match',indicator:'M'}];

//
// isOptionGroup() - returns true if the given viewname has the "robotGroup" option.
//
function isOptionGroup(viewData)
{
    return(viewData.constraint.includes("robot") &&
	   viewData.hasOwnProperty('option') && viewData.option.includes("robotGroup"));
}

//
// viewData() - downloads all of the view data from the XML file (actually, the computed
//              JSON file). Note that the data is reorganized to have the name of the view
//              be in the VIEW_DATA object to make retrieval easier.
//
function viewDataRefresh(callback)
{
    jQuery.get("../season.json",
	       null,
	       function(data,status,jqXHR) {
		   // all of the XML data is here, so get the view section
		   
		   var views = data.views;
		   var rawData = data.rawData;
		   var metaData = data.metaData;

		   VIEW_DATA = {};  // clear the object
		   for(var i=0; i < data.views.length; i++) {
		       VIEW_DATA[data.views[i].name] = data.views[i];
		   }

		   // now fix the views to have direct references to the appropriate
		   // fields from either the rawData or metaData - NOTE that there are
		   // some built-in fields that are added here because they will normally
		   // NOT be in the <elements>

		   for(var viewName in VIEW_DATA) {
		       var view = VIEW_DATA[viewName];
		       var perspective = view.perspective;

		       var specialFields = [
			   { name:"year", label:"Year", type:"int" },
			   { name:"robot", label:"Robot", type:"text" },
			   { name:"competition", label:"Competition", type:"text" },
			   { name:"match", label:"Match", type:"int" },
			   { name:"date", label: "Date", type:"date"},
			   { name:"teamColor", label: "Team Color", type:"text"}
		       ];
		       
		       var newFieldArray = [];

		       fieldAugment:
		       for(var i=0; i < view.field.length; i++) {
			   var fieldname = view.field[i]

			   // have to try to find the field in all of the potential field
			   //   definition areas, in an order that obeys the rules...

			   var locations = [
			       specialFields,
			       metaData[perspective],    // current perspective overrides EVERYTHING
			       rawData,
			       metaData.match,       
			       metaData.competition,
			       metaData.robot,
			       metaData.year,
			       metaData.top
			   ];

			   for(var j=0; j < locations.length; j++) {
			       for(var k=0; k < locations[j].length; k++) {
				   if(locations[j][k].name == fieldname) {
				       newFieldArray.push(locations[j][k]);
				       continue fieldAugment;      // skip to the next field
				   }
			       }
			   }
		       }
		       view.field = newFieldArray;
		   }
		   callback(VIEW_DATA);
	       },
	       'json');
}

//
// viewListRefresh() - refresh the view list. The target div is given in "target".
//                          Does nother if the CURRENT_VIEW is null, otherwise, it
//                          will refresh
//
function viewListRefresh()
{
    $('.listbox .throbber').show();

    var target = $('.content > .listbox > .list');
    
    target.empty();

    viewDataRefresh(viewListRefresh_load.bind(null,target));
}

//
// viewListRefresh_load() - the work-horse that does the actual refresh of the view list.
//
function viewListRefresh_load(target,data)
{
    $('.listbox .throbber').hide();

    $('div.multi-on-button').hide();         // hide the turn-on-multi indicator
    $('div.constraint-input-multi').hide();  // hide the multi-selector lists

    var output = "";

    var odd = true;
    for(var viewname in data) {
	output += '<div class="list-choice ' + ((odd)?'odd':'even') + '" data-name="' + data[viewname].name + '">';
	output += '<div class="list-icon">';
	switch(data[viewname].type) {
	case 'table':  output += '<img src="chart-512-512.png">'; break;
	case 'record': output += '<img src="report-512-512.png">'; break;
	case 'pie':    output += '<img src="pie-512-512.png">'; break;
	case 'bar':    output += '<img src="bar-512-512.png">'; break;
	case 'trend':  output += '<img src="trend-512-512.png">'; break;
	case 'stacked':output += '<img src="bar-512-512.png">'; break;
	case 'imagemap':output += '<img src="heatmap-512x512.png">'; break;
	}
	output += '</div>';

	output += '<div class="list-name">' + data[viewname].name + '</div>';
	output += '<div class="list-label">' + data[viewname].label;
	if(data[viewname].hasOwnProperty('constraint')) {
	    // this keeps the constraint indicators in order - indepedent upon the xml file order
	    ALL_CONSTRAINTS.forEach((element) => {
		if(data[viewname].constraint.includes(element.constraint)) {
		    var modifier = "";
		    if(element.constraint == 'robot') {          // special treatment of robot groups
			if(isOptionGroup(data[viewname])) {
			    modifier += '<span style="color:black">|</span>';
			    modifier += '<span style="color:red">R</span>';
			}
		    }
		    output += '<span class="list-constraint constraint-' + element.constraint + '">' +
			element.indicator + modifier + '</span>';
		}
	    });
	}
	output += '</div>';
	output += '</div>';
	odd = !odd;
    }
    target.append(output);

    // now that everything has been put into the DOM, attach an appropriate handler to clicky

    $('.list-choice').click(function() {
	$('.listbox').hide('fast');
	CURRENT_VIEW.name = $(this).data('name');
	viewDisplay();
    });
}

//
// viewDisplay() - set-up for display of a particular view.
//
function viewDisplay(name)
{
    var view = VIEW_DATA[CURRENT_VIEW.name];

    viewTitleSet(view.name,view.label);

    // default all of the selectors
    
    selectorSet('year','');
    selectorSet('robot','');
    selectorSet('competition','');
    selectorSet('match','');

    // turn on those that are part of the constraints

    var c = view.constraint;     // just for ease of typing...

    // turn on the selector for constraints that ARE constraints
    for(var i=0; i < c.length; i++) {
	selectorSet(c[i],[]);
    }

    // disable all constraints - will enable the top one when data populates

    selectorEnable("year",false);
    selectorEnable("robot",false);
    selectorEnable("competition",false);
    selectorEnable("match",false);

    constraintPopulateAll({});
    
    $('.results-box').empty();

    // now set-up for a check of the selector right away, but give the
    //   UI time to catch-up
    
    setTimeout(function() {
	selectorGoEnable(checkConstraints());
    },1000);
}

//
// viewGoLoad() - called when GO is clicked, populate and show the table
//
function viewGoLoad()
{
    var view = VIEW_DATA[CURRENT_VIEW.name];
    var type = view.type;

    var display;

    var target = $('.results-box');

    switch(type) {
    case 'table':    display = viewTableHTML.bind(null,target); break;
    case 'bar':      display = viewBar.bind(null,target); break;
    case 'report':   display = viewReportHTML.bind(null,target); break;
    case 'pie':      display = viewPie.bind(null,target); break;
    case 'trend':    display = viewTrend.bind(null,target); break;
    case 'stacked':  display = viewStacked.bind(null,target); break;
    case 'imagemap': display = viewImageMap.bind(null,target); break;
    }
	
    viewPopulate(display);
}

//
// viewPopulate() - with a set-up view, go ahead and populate it with data.
//
function viewPopulate(callback)
{
    var view = VIEW_DATA[CURRENT_VIEW.name];

    var fields = view.field;

    databaseRecords(getConstraints(),(records) => {
	var filtered = databasePerspectiveFilter(records,view.perspective);

	// at this point, we have records, we just need to display them
	// according to the view
	//
	// console.log(filtered);
	//
	
	CURRENT_VIEW.headers = [];
	for(var i=0; i < fields.length; i++ ) {
	    CURRENT_VIEW.headers.push(fields[i].label);
	}

	// the data values in the fields[] are subject to perspective

	CURRENT_VIEW.data = [ ];

	// for each of the fields, get all rows of data from the filtered
	//   data
	for(var i=0; i < filtered.length; i++) {   // loop through the records
	    var currentRow = [];
	    for(var j=0; j < fields.length; j++) {
		var fieldName = fields[j].name; 
		if(!fields[j].hasOwnProperty("perspective") || fields[j].perspective == "match") {
		    currentRow.push(filtered[i][fieldName]);
		} else {
		    var meta = fields[j].perspective + "_metaData";
		    if(filtered[i].hasOwnProperty(meta)) {
			if(filtered[i][meta].hasOwnProperty(fieldName) &&
			   typeof filtered[i][meta][fieldName] != "undefined") {
			    currentRow.push(filtered[i][meta][fieldName]);
			} else {
			    currentRow.push("-");
			}
		    } else {
			currentRow.push("NA");
		    }
//		    currentRow.push(filtered[i][fields[j].perspective + "_metaData"][fieldName]);
		}
	    }

	    CURRENT_VIEW.data.push(currentRow);
	}

	// sort comes in as a single field setting in the view

	CURRENT_VIEW.sort = [];
	CURRENT_VIEW.sortType = [];
	
	if(view.hasOwnProperty("sort")) {
	    var sort = view.sort.split(",");    // [0] is the column, [1] is the sort dir, ([2] data type)
	    for(var i=0; i < fields.length; i++) {
		if(fields[i].name == sort[0]) {
		    CURRENT_VIEW.sort.push(sort[1]);
		} else {
		    CURRENT_VIEW.sort.push("none");
		}
		if(sort.length > 2) {
		    CURRENT_VIEW.sortType.push(sort[2]);
		} else {
		    CURRENT_VIEW.sortType.push(null);
		}
	    }
	} else {
	    for(var i=0; i < fields.length; i++) {
		CURRENT_VIEW.sort.push("none");
	    }
	    CURRENT_VIEW.sort[0] = "DESC";
	}

	CURRENT_VIEW.dataTypes = [];

	for(var i=0; i < fields.length; i++) {
	    CURRENT_VIEW.dataTypes.push(fields[i].type);
	}

	// add the formats to the data, but default all formats to null first
	
	CURRENT_VIEW.format = [];
	for(var i=0; i < fields.length; i++) {
	    CURRENT_VIEW.format.push(null);
	}

	if(view.hasOwnProperty("format")) {
	    for(var j=0; j < view.format.length; j++) {
		var format = view.format[j].split(',');  // [0] field, [1] formatFN, [2-] args
		for(var i=0; i < fields.length; i++) {
		    if(fields[i].name == format[0]) {
			format.splice(0,1);
			CURRENT_VIEW.format[i] = format;
		    }
		}
	    }
	}

	if(callback) callback();
    });
}

//
// chartsTypeTranslate() - translates incoming XML data types to those understood
//                         by google charts.
//
function chartsTypeTranslate(dataType)
{
    switch(dataType) {
    case 'number':
    case 'int':
    case 'choice':  return('number');

    case 'event':
    case 'array':
    case 'text':    return('string');

    case 'date':    return('date');

    default:	    return('string');
    }
}

//
// chartsDataTranslate() - related closely to the above, this routine will transform
//                         data from the type specified in XML to the type necessary
//                         for google charts.
//
//     TODO - this isn't everywhere like it should be!
//
function chartsDataTranslate(dataType,data)
{
    switch(dataType) {
    case 'number':
    case 'int':
    case 'choice':  
    case 'event':
    case 'text':    return(data);

    case 'array':   return(data[0]);

    case 'date':    return(new Date(data));

    default:	    return(data);
    }
}    


//
// viewBar() - spit out a pretty bar chart using google charts
//
function viewBar(target)
{
    target.empty();

    google.charts.load('current', {packages: ['corechart', 'bar']});
    google.charts.setOnLoadCallback(viewBar_FN.bind(null,target));

//    $(window).resize(viewBar_FN.bind(null,target));
}

function viewBar_FN(target)
{
    var name = CURRENT_VIEW.name;
    var headers = CURRENT_VIEW.headers;
    var data = CURRENT_VIEW.data;
    var dataTypes = CURRENT_VIEW.dataTypes;
    var sort = CURRENT_VIEW.sort;
    var sortType = CURRENT_VIEW.sortType;
    var format = CURRENT_VIEW.format;

    viewTableSort(data,dataTypes,sort);         // replaces the data by a sorted version

    var dataTable = new google.visualization.DataTable();

    for(var i=0; i < headers.length; i++) {
	dataTable.addColumn(chartsTypeTranslate(dataTypes[i]), headers[i]);
    }

    dataTable.addRows(data);
    
//    for(var i=0; i < data.length; i++) {
//	dataTable.addRow([data[i][0],data[i][1]]);
    //    }
    
    var options = {
        title: name,
        hAxis: {
            title: headers[0],
            viewWindow: {
		min: [7, 30, 0],
		max: [17, 30, 0]
            }
        },
        vAxis: {
            title: headers[1]
        },
	backgroundColor: { fill:'transparent' }
    };

    var chart = new google.visualization.ColumnChart(target.get(0));

    google.visualization.events.addOneTimeListener(chart,
						   'ready',
						   function() {
						       $('.results-box .throbber').hide();
						   });

    $('.results-box .throbber').show();
    chart.draw(dataTable, options);
}

//
// viewTrend() - spit out a pretty line chart using google charts
//
function viewTrend(target)
{
    target.empty();

    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(viewTrend_FN.bind(null,target));

    // TODO - need to remove these when viewing multiple charts!
//    $(window).resize(viewTrend_FN.bind(null,target));
}

//
// ** Thu Feb 28 14:30:20 2019 **
// So this all works - HOWEVER
//   There needs to be a mechanism (probably a built-in "index" field)
//   that allows the data to be organized one-by-one - that is, sorted by date,
//   show the matches in order from 1 to X along with performance.
//   PROPOSAL - create "index" which is related to the uniqueness of perspective
//     Each record has an index, which counts starting at 1, and increases for
//     every unique record as returned. This does indicate a "sort" to make the
//     index increase by a useful amount (sorted by date for example).

function viewTrend_FN(target)
{
    var name = CURRENT_VIEW.name;
    var headers = CURRENT_VIEW.headers;
    var data = CURRENT_VIEW.data;
    var dataTypes = CURRENT_VIEW.dataTypes;
    var sort = CURRENT_VIEW.sort;
    var format = CURRENT_VIEW.format;

    viewTableSort(data,dataTypes,sort);         // replaces the data by a sorted version

    var dataTable = new google.visualization.DataTable();

    // trend data has to be re-organized, relative to the other charts
    // We need the columns to be:
    // 
    //        date robot1 robot2 ...
    //        ---- ------ ------
    //         d    AAR    AAR
    //
    // Records need to come in as: [ x-axis, line-id, data-value ]
    //                                [0]       [1]      [2]
    //
    // For example: [ date, robot, masterAAR, ... ]
    //
    // The records will be re-organized to the columnar format above

    // get all of the unique values for the line-id for use in the headers
    //  and in structing the data appropriately

    var lineIDs = [];
    for(var row=0; row < data.length; row++) {
	if(!lineIDs.includes(data[row][1])) {
	    lineIDs.push(data[row][1]);
	}
    }

    // get all of the unique x-axis values, which will be the lead value for the rows
    var xaxisVals = [];
    for(var row=0; row < data.length; row++) {
	if(!xaxisVals.includes(data[row][0])) {
	    xaxisVals.push(data[row][0]);
	}
    }
    xaxisVals.sort((a,b)=>a-b);

    // the headers are a bit weird - each of the line-id needs to be a header

    dataTable.addColumn(chartsTypeTranslate(dataTypes[0]), headers[0]);
    for(var i=0; i < lineIDs.length; i++) {
	// tricky here - the data type is for the DATA "[2]" but label is the line-id "[1]"
	dataTable.addColumn(chartsTypeTranslate(dataTypes[2]),lineIDs[i]);
    }

    // now create the new table with this data
    // Start off with creating the rows

    for(var row=0; row < xaxisVals.length; row++) {
	console.log("setValue: " + row + ',' + "0" + ',' + xaxisVals[row]);
	dataTable.addRow();
	dataTable.setValue(row,0,chartsDataTranslate(dataTypes[0],xaxisVals[row]));
    }

    // now cruise through the data, placing each value in the table where
    //  it belongs

    for(var row=0; row < data.length; row++) {
	console.log("setValue: " +
		    xaxisVals.indexOf(data[row][0]) + ',' +
		    (lineIDs.indexOf(data[row][1])+1) + ',' +
		    data[row][2]);
	dataTable.setValue(xaxisVals.indexOf(data[row][0]),
			   lineIDs.indexOf(data[row][1])+1,
			   data[row][2]);
    }
    
    var options = {
        title: name,
	interpolateNulls: true,
	vAxis: { title: headers[2] },
	backgroundColor: { fill:'transparent' },
	pointSize: 10,
    };

    var chart = new google.visualization.LineChart(target.get(0));

    chart.draw(dataTable, options);
}


//
// viewPie() - spit out a pretty pie chart using google charts
//
function viewPie(target)
{
    target.empty();

    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(viewPie_FN.bind(null,target));

//    $(window).resize(viewPie_FN.bind(null,target));
}

function viewPie_FN(target)
{
    var name = CURRENT_VIEW.name;
    var headers = CURRENT_VIEW.headers;
    var data = CURRENT_VIEW.data;
    var dataTypes = CURRENT_VIEW.dataTypes;
    var sort = CURRENT_VIEW.sort;
    var format = CURRENT_VIEW.format;

    viewTableSort(data,dataTypes,sort);         // replaces the data by a sorted version

    var dataTable = new google.visualization.DataTable();

    for(var i=0; i < headers.length; i++) {
	dataTable.addColumn(chartsTypeTranslate(dataTypes[i]), headers[i]);
    }

    dataTable.addRows(data);
    
//    for(var i=0; i < data.length; i++) {
//	dataTable.addRow([data[i][0],data[i][1]]);
    //    }
    
    var options = {
        title: name,
	backgroundColor: { fill:'transparent' },
	pieSliceText: 'label',
	legend: {position:'left'},
	sliceVisibilityThreshold: 1/20,
	is3D: true
    };

    var chart = new google.visualization.PieChart(target.get(0));

    chart.draw(dataTable, options);
}

//
// viewStacked() - spit out a pretty stacked chart
//
function viewStacked(target)
{
    var data = CURRENT_VIEW.data;

    target.empty();

    google.charts.load('visualization','1.1', {packages: ['bar']});

    if(isOptionGroup(VIEW_DATA[CURRENT_VIEW.name])) {
	var split = multiSelected('robot');
	var splitData = groupSplitData(data,split.red,split.blue);
	google.charts.setOnLoadCallback(viewStacked_FN_Group.bind(null,target,splitData.blue,splitData.red));
    } else {
	viewStacked_FN(target);
    }

//    $(window).resize(viewStacked_FN.bind(null,target));
    
}

//
// viewStacked_FN_Group() - this function is specified for showing robotGroup style data. It
//                          creates a side-by-side comparision of the given data for the given
//                          robots.
//
//                     Data format for a stacked chart is as follows:
//                     row[0] = the ID that is used to form segments of an individual bar
//                     row[1..] = each attribute that will be a separate bar
//
//         For example:
//                       robot   points   panels   cargo
//                       -----   ------   ------   -----
//                       2468      10       20       30
//                        624       5       10       40
//                       4610      22        5       24
//
//         With this data, there will be 3 bars "points", "panels", "cargo"
//         and each bar will have three segments named "2468", "624", and "4610"
//         The vertical axis will be labeled with the row[1..] labels and the overall
//         axis
//

function viewStacked_FN_Group(target,blueData,redData)
{
    var name = CURRENT_VIEW.name;
    var label = VIEW_DATA[name].label;
    var headers = CURRENT_VIEW.headers;
    var data = CURRENT_VIEW.data;
    var dataTypes = CURRENT_VIEW.dataTypes;
    var sort = CURRENT_VIEW.sort;
    var sortType = CURRENT_VIEW.sortType;
    var format = CURRENT_VIEW.format;

    viewTableSort(data,dataTypes,sort);         // replaces the data by a sorted version

    var data = new google.visualization.DataTable();

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn("string","Red/Blue Comparison");
    
    for(var i=0; i < blueData.length; i++) {
	dataTable.addColumn("number",blueData[i][0]);  // robot MUST be [0] for this to all work!
    }
    for(var i=0; i < redData.length; i++) {
	dataTable.addColumn("number",redData[i][0]);   // robot MUST be [0] for this to all work!
    }

    // now we create a set of data that is really the rotation of the incoming data
    //   where the columns are the robot scores and the rows are the attributes.

    var rows = [];
    for(var i=1; i < headers.length; i++) {
	var row = [headers[i]];
	rows.push(row);
    }

    for(var i=0; i < rows.length; i++) {
	for(var j=0; j < blueData.length; j++) {
	    rows[i].push(Number(blueData[j][i+1]));
	}
	for(var j=0; j < redData.length; j++) {
	    rows[i].push(Number(redData[j][i+1]));
	}
    }

    // need to figure out the maximum on the y-axis to make things work well
    var maxTotal = 0;
    
    for(var i=1; i < headers.length; i++) {
	var total = 0;
	for(var j=0; j < blueData.length; j++) {
	    total += blueData[j][i];
	}
	if(total > maxTotal) {
	    maxTotal = total;
	}
    }

    for(var i=1; i < headers.length; i++) {
	var total = 0;
	for(var j=0; j < redData.length; j++) {
	    total += redData[j][i];
	}
	if(total > maxTotal) {
	    maxTotal = total;
	}
    }

    dataTable.addRows(rows);

    var options = {
        isStacked: true,
        width: 800,
//        height: 600,
        chart: {
            title: name,
            subtitle: label,
        },
        vAxis: {
            viewWindow: {
                min: 0,
                max: maxTotal*1.1
            }
	},
	series: {}
    };

    // now, we use a google charts trick to put the second set of data (red)
    //   on the "second" axis

    for(var i=0; i < redData.length; i++) {
	options.series[i+blueData.length] = { targetAxisIndex: 1 };
    }

    console.log(target.get[0]);
    var chart = new google.charts.Bar(target.get(0));
    chart.draw(dataTable, google.charts.Bar.convertOptions(options));
}


function viewStacked_FN(target)
{
}

//
// multiSelected() - returns an object with the things that are selected in the multi-
//                   select box specified. { all:[], blue:[], red:[] }
//
//                      all - all selected
//                     blue - selected marked as blue
//                      red - selected marked as red
//
function multiSelected(selector)
{
    var all = [];
    var blue = [];
    var red = [];
    
    var selected = $('.multi-selection-' + selector + '.selected').each(function() {
	var value = "" + $(this).data("value");       // TODO - should this ALWAYS be a string?
	all.push(value);

	if($(this).hasClass('blue')) {
	    blue.push(value);
	} else if($(this).hasClass('red')) {
	    red.push(value);
	}
    });

    return({all:all,blue:blue,red:red});
}

//
// findFieldIndex() - Return the index of the given field in the current view.
//                    -1 is returned if field not found.
//
function findFieldIndex(fieldName)
{
    var fields = VIEW_DATA[CURRENT_VIEW.name].field;

    for(var i=0; i < fields.length; i++) {
	if(fields[i].name == fieldName) {
	    return(i);
	}
    }

    return(-1);
}

//
// groupSplitData() - split the given data up into two groups, returning them as separate
//                arrays. The data is ASSUMED to have "robot" column, as the data will
//                be split by robot, according to the multi-select blue/red.
//
function groupSplitData(data,red,blue)
{
    var rindex = findFieldIndex('robot');
    if(rindex < 0) {
	console.log("ERROR: robotGroup option view doesn't have 'robot' column");
	return({});
    }
    
    var redData = [];
    var blueData = [];

    for(var i=0; i < data.length; i++) {
	if(red.includes(data[i][rindex])) {
	    redData.push(data[i]);
	} else if(blue.includes(data[i][rindex])) {
	    blueData.push(data[i]);
	}
    }

    return({red:redData,blue:blueData});
}


//
// viewTableHTML() - Refreshes the current view to the table area. It is normally
//                   called when the data is refreshed or sorting changes. It looks
//                   at the CURRENT_VIEW, assuming that its data has been updated
//                   appropriately.
//
//                   This call can handle "robotGroup" reports, too. It will create
//                   two floating divs within the target with two different tables.
//
function viewTableHTML(target)
{
    var data = CURRENT_VIEW.data;

    if(isOptionGroup(VIEW_DATA[CURRENT_VIEW.name])) {
	var split = multiSelected('robot');
	var splitData = groupSplitData(data,split.red,split.blue);
	
	var redDiv = $('<div class="groupTable red"></div>');
	var blueDiv = $('<div class="groupTable blue"></div>');

	var redAverageRow = specialRow(splitData.red,'average');
	var redTotalRow = specialRow(splitData.red,'total');
	var blueAverageRow = specialRow(splitData.blue,'average');
	var blueTotalRow = specialRow(splitData.blue,'total');

	console.log(redAverageRow);
	console.log(redTotalRow);
	console.log(blueAverageRow);
	console.log(blueTotalRow);

	viewTableHTML_table(splitData.red,redDiv,redTotalRow,redAverageRow);
	viewTableHTML_table(splitData.blue,blueDiv,blueTotalRow,blueAverageRow);

	target.empty();
	target.append(redDiv);
	target.append(blueDiv);
    } else {
	viewTableHTML_table(data,target,null,null);
    }

    // now, light-up the controls

    // delete symbol
    $('.headersymbol.x').click(function() {
	if(CURRENT_VIEW.headers.length == 1) {
	    if($(this).hasClass("no")) {
		alert("OK, I guess I need to remove the temptation.");
		$('.headersymbol.x').remove();
	    } else {
		alert("Dude, seriously, you want to remove the LAST column?  Sorry.");
		$('.headersymbol.x').addClass("no");
	    }
	} else {
	    var col = $(this).parent().data("col");
	    CURRENT_VIEW.headers.splice(col,1);
	    CURRENT_VIEW.dataTypes.splice(col,1);
	    CURRENT_VIEW.sort.splice(col,1);
	    CURRENT_VIEW.format.splice(col,1);
	    for(var i=0; i < CURRENT_VIEW.data.length; i++) {
		CURRENT_VIEW.data[i].splice(col,1);
	    }
	    viewTableHTML(target);
	}
    });

    // sorting symbols
    $('.sortsymbol.up').click(function() {
	var col = $(this).parent().data('col');
	for(var i=0; i < CURRENT_VIEW.sort.length; i++) {
	    CURRENT_VIEW.sort[i] = "none";
	}
	CURRENT_VIEW.sort[col] = 'ASC';
	viewTableHTML(target);
    });
    $('.sortsymbol.down').click(function() {
	var col = $(this).parent().data('col');
	for(var i=0; i < CURRENT_VIEW.sort.length; i++) {
	    CURRENT_VIEW.sort[i] = "none";
	}
	CURRENT_VIEW.sort[col] = 'DESC';
	viewTableHTML(target);
    });
    
}
    
function viewTableHTML_table(data,target,totalRow,averageRow)
{
    var output = "";

    var headers = CURRENT_VIEW.headers;
    var dataTypes = CURRENT_VIEW.dataTypes;
    var sort = CURRENT_VIEW.sort;
    var format = CURRENT_VIEW.format;

    // will stay as empty string if there are no special rows

    var specialRows = "";
    specialRows += specialRow_HTML(totalRow,"totalRow","TOT");
    specialRows += specialRow_HTML(averageRow,"averageRow","AVG");

    viewTableSort(data,dataTypes,sort);         // replaces the data by a sorted version

    output += '<table class="viewTable">';
    output += '<thead><tr>';

    for(var col=0; col < headers.length; col++) {
	output += '<th align="center" data-col="' + col + '">';

	output += '<span class="sortsymbol down ' + ((sort[col]=='DESC')?"selected":"") + '">&#x25bc;</span>';
	output += '<span class="sortsymbol up ' + ((sort[col]=='ASC')?"selected":"") + '">&#x25b2;</span>';
	output += headers[col];
	output += '<span class="headersymbol x">&#x2716;</span>';
	output += '</th>';
	
    }

    output += '</tr></thead>';
    output += '<tbody>';
    for(var row=0; row < data.length; row++) {
	output += '<tr>';
	for(var col=0; col < data[row].length; col++) {
	    //	    output += '<td align="' + (dataTypes[col]=='number'?'center':'left') + '">';
	    output += '<td align="center">';
	    output += viewDataFormat(data[row][col],format[col]);
	    output += '</td>';
	}
	output += '</tr>';
    }

    output += specialRows;
    output += '</tbody>';
    output += '<tfoot>';
    output += '<tr><td colspan="' + headers.length + '">';
    output += data.length.toString() + " record" + ((data.length==1)?"":"s");
    output += '</td></tr>';
    output += '</tfoot>';
    output += '</table>';

    // add the html to the right spot
    target.empty();
    target.append(output);

}

//
// specialRow_HTML() - return the HTML for the special rows to fit right in
//                      the "current" table.  Will return empty string if there
//                      are no special rows. So the caller doesn't have to special
//                      case the special rows.
//
function specialRow_HTML(row,classText,label)
{
    var output = "";
    var hasData = false;

    if(row) {
	for(var i=0; i < row.length; i++) {
	    if(row[i] !== null) {
		hasData = true;
		break;
	    }
	}
    }

    if(hasData) {
	output += '<tr class="specialRow-row ' + classText + '-row">';
	for(var i=0; i < row.length; i++) {
	    output += '<td class="specialRow-data ' + classText + '-data';
	    if(row[i] === null) {
		output += ' empty';
	    }
	    output += '">';
	    if(row[i] !== null) {
		output += viewDataFormat(row[i],CURRENT_VIEW.format[i]);
	    }
	    output += '</td>';
	}
	output += '<td class="specialRow-label ' + classText + '-label">' + label + '</td>';
	output += '</tr>';
    }

    return(output);
}

//
// viewDataFormat() - given a format from the view XML, format the incoming
//                    data appropriately.
//
function viewDataFormat(data,format)
{
    if(format === null) {
	return(data);
    }

    var formatted = data;
    
    switch(format[0]) {

    case "toFixed":
	var num = parseFloat(data);
	if(!isNaN(num)) {
	    formatted = num.toFixed(format[1]);
	}
	break;
	
    case "percent":
    	var num = parseFloat(data);
	if(!isNaN(num)) {
	    formatted = num * 100;
	    formatted = formatted.toFixed(0);
	    formatted = formatted.toString() + "%";
	}
	break;
    }

    return(formatted);
}
	

//
// viewTableSort() - sorts the data
//
function viewTableSort(data,dataTypes,sort)
{
    // the idea is to sort the rows of data according to their content, using
    //   their dataTypes and sort or given in those two arrays.

    data.sort(viewTableSort_FN.bind(null,dataTypes,sort));
}

//
// viewTableSort_FN() - the workhorse of sorting tables. It is handed two
//                      rows (along with the bound dataTypes and sort order)
//                      and returns 
//
function viewTableSort_FN(dataTypes,sort,a,b)
{
    for(var i=0; i < sort.length; i++) {
	if(sort[i] != "none") {
	    var aUndef = typeof a[i] == "undefined";
	    var bUndef = typeof b[i] == "undefined";
	    if(aUndef && bUndef) return(0);
	    if(sort[i] == "ASC") {
		if(aUndef) return(-1);
		if(bUndef) return(1);
		return((a[i] <= b[i])?((a[i]==b[i])?0:-1):1);
	    } else {
		if(aUndef) return(1);
		if(bUndef) return(-1);
		return((a[i] <= b[i])?((a[i]==b[i])?0:1):-1);
	    }
	}
    }

    return(0);    // if nothing is marked for sorting, then don't sort
}

function viewImageMap(target)
{
    var data = CURRENT_VIEW.data;
    var headers = CURRENT_VIEW.headers
    var viewData = VIEW_DATA[CURRENT_VIEW.name];

    // incoming data
    //  [0] is the field that is being plotted
    //  [1] is the data being plotted
    //  [2] is the color of the data being plotted (if missing, 'none' is assumed)
    
    target.empty();

    var sizeX = 600;
    var sizeY = 600;

    // process the option(s) that can come in
    
    if(viewData.hasOwnProperty('option')) {
	for(let i=0; i < viewData.option.length; i++) {
	    var optionSplit = viewData.option[i].split(',');
	    switch(optionSplit[0]) {
	    case 'size':
		if(optionSplit.length == 3) {
		    sizeX = optionSplit[1];
		    sizeY = optionSplit[2];
		}
		break;
	    }
	}
    }

    // now set-up the image and overlay canvases

    var canvasCSS = {
	width:sizeX,
	height:sizeY,
	position:'absolute',
	top:0,
	left:0
    };

    var groupNum = 1;     // the groups of overlaid canvasas
    
    var imageCanvasID = 'ic' + groupNum;
    var imageCanvas = $('<canvas id="' + imageCanvasID + '" width="' + sizeX + '" height="' + sizeY + '"/>');
    imageCanvas.css(canvasCSS);
    target.append(imageCanvas);

    // one overlay for each incoming data set
    var overlayCanvases = {};
    var overlayMaps = {};

    for(i=0; i < data.length; i++) {
	var overlayID = 'overlay' + groupNum + '-' + i;

	overlayCanvases[overlayID] = $('<canvas id="' + overlayID + '" width="' + sizeX + '" height="' + sizeY + '"/>');
	overlayCanvases[overlayID].css(canvasCSS);
	overlayCanvases[overlayID].css('z-index',100);
        target.append(overlayCanvases[overlayID]);

	overlayMaps[overlayID] = new simpleheat(overlayCanvases[overlayID].get(0));
	overlayMaps[overlayID].max(2);
	overlayMaps[overlayID].opacity(0.025);
	overlayMaps[overlayID].resize();

	console.log("working on " + data[i][0] + ' (' + overlayID + ')');

	for(let j=0; j < data[i][1].length; j++) {
	    console.log("adding (" + data[i][1][j].x/100*sizeX + "," + data[i][1][j].y/100*sizeY + ")");
	    overlayMaps[overlayID].add([data[i][1][j].x / 100 * sizeX,data[i][1][j].y / 100 * sizeY,1]);
	}
	overlayMaps[overlayID].draw();
    }

    // create the legend along the side, along with checkboxes for on/off

    var legendID = 'legend';
    var legendCSS = {                    // other parameters set in statistics.css
	height:sizeY,
	position:'absolute',
	top:0,
	left:sizeX
    };
    var legendDiv = $('<div class="imageMapLegend"/>');
    var legendTitleDiv = $('<div class="imageMapLegend title"/>');
    var legendItemsDiv = $('<div class="imageMapLegend items"/>');

    legendDiv.css(legendCSS);
    target.append(legendDiv);

    legendDiv.append(legendTitleDiv);
    legendDiv.append(legendItemsDiv);
    legendTitleDiv.append(headers[0]);

    // create the checkbox(es)

    for(i=0; i < data.length; i++) {
	var overlayID = 'overlay' + groupNum + '-' + i;
	var octext = 'onclick=\'$("#' + overlayID + '").toggle();\'';
	var textColor = 'none';
	if(data[i].length > 2) {
	    textColor = data[i][2];
	}
	legendItemsDiv.append($('<label class="' + textColor + '"><input type="checkbox" checked ' + octext + '>' + data[i][0] + '</label><br>'));
    }
}

function viewTitleSet(name,description)
{
    $('.viewtitle-box .title').text(name);
    $('.viewtitle-box .description div').text(description);
}

function constraintPopulateAll(previousValues)
{
    constraintPopulateDown("year",previousValues);

//    var c = VIEW_DATA[CURRENT_VIEW.name].constraint;
////
//    if(!previousValues) {
//	previousValues = {};
//    }
//
//    constraintPopulate(c,"year",previousValues,
//       (values) => constraintPopulate(c,"robot",values,
//	      (values) => constraintPopulate(c,"competition",values,
//					     (values) => constraintPopulate(c,"match",values,null))));
}

//
// constraintPopulateDown() - given a level, and current values for constraints, populate
//                            the lower constraints appropriately. Note that the currentValues
//                            may (should) have values for upper levels.
//      currentValues = { year:[<values>], robot:[<values>], competition:[<values>], match[<values>] }
//
function constraintPopulateDown(level,currentValues)
{
    var c = VIEW_DATA[CURRENT_VIEW.name].constraint;

    if(!currentValues) {
	currentValues = {};
    }

    var callbacks = { };

    callbacks["match"] = constraintPopulate.bind(null,c,"match",null);
    callbacks["competition"] = constraintPopulate.bind(null,c,"competition",callbacks["match"]);
    callbacks["robot"] = constraintPopulate.bind(null,c,"robot",callbacks["competition"]);
    callbacks["year"] = constraintPopulate.bind(null,c,"year",callbacks["robot"]);

    callbacks[level](currentValues);
}
    
//
// constraintPopulate() - the idea here is to populate the given level with values based
//                        upon the upper levels. But there are two meanings of the term
//                        "populate" in this context, either populate a selector with an
//                        array of choices or set the selector to the only value. If there
//                        is only one possible choice for a given constraint, then set it
//                        and move on to the next constraint.
//
//        constraints - always given and complete with constraint names
//              level - year||robot||competition||match
//           callback - routine to callback after this level has been processed
//            cvalues - constraint "values" - actual values that have either been selected
//                      or defaulted (if only one) for each level. A level may not be in
//                      the object.
//
//                Rules:
//                   - if the current level isn't a constraint, then it should be ignored
//                     and lower levels processed.
//                   - otherwise, if the current level is given, and has a value(s) that means that
//                     a value has been selected by the user, so process lower levels
//                   - if the current level DOESN'T have a value or is length of zero, then
//                     the level should be populated by constraining data based upon the upper-level
//                     constraints.
//

function constraintPopulate(constraints,level,callback,cvalues)
{
    // not a constraint for this view - so skip it, but call the callback if given

    if(!constraints.includes(level)) {
	cvalues[level] = [];
	if(callback) {
	    callback(cvalues);
	}
	return;
    }

    // if this level has values already, then don't populate it.
    
    if(cvalues.hasOwnProperty(level) && cvalues[level].length > 0) {    // value already given
	if(callback) {
	    callback(cvalues);
	}
	return;
    }

    // we know the currentlevel is a constraint, and it has zero length (no values)
    //   so go get the data for the level, IF the upper levels are specified.

    // the concept of "specified enuf" means that the "above" level is either NOT a constraint
    //   or has a specified value(s)

    var specifiedEnuf = (otherLevel) => !constraints.includes(otherLevel) || cvalues[otherLevel].length > 0;

    switch(level) {

    case 'year':
	databaseGetYears((values) => {
	    selectorSet("year",values);        // sets the values to the drop-down/multi selector
	    if(values.length == 1) {
		cvalues.year = values;
		if(callback) callback(cvalues);   // only do callbacks if this level is a single
	    }
	});
	break;
	
    case 'robot':
	if(specifiedEnuf('year')) {
	    databaseGetRobots(cvalues.year,(values) => {
		selectorSet("robot",values);
		if(values.length == 1) {
		    cvalues.robot = values;
		    if(callback) callback(cvalues);
		}
	    });
	}
	break;

    case 'competition':
	if(specifiedEnuf('year') && specifiedEnuf('robot')) {
	    databaseGetCompetitions(cvalues.year,cvalues.robot,(values) => {
		selectorSet("competition",values);
		if(values.length == 1) {
		    cvalues.competition = values;
		    if(callback) callback(cvalues);
		}
	    });
	}
	break;

    case 'match':
	if(specifiedEnuf('year') && specifiedEnuf('robot') && specifiedEnuf('competition')) {
	    databaseGetMatches(cvalues.year,cvalues.robot,cvalues.competition,(values) => {
		selectorSet("match",values);
		if(values.length == 1) {
		    cvalues.match = values;
		    if(callback) callback(cvalues);
		}
	    });
	}
	break;
    }
}

//
// constraintNext() - returns the NEXT view-relavent constraint adjacent to this one on the right.
//                    Returns null if there isn't one, otherwise returns its name.
//
function constraintNext(name)
{
    var viewConstraints = VIEW_DATA[CURRENT_VIEW.name].constraint;

    // loop through ALL_CONSTRAINTS minus 1, for the last one doesn't have a "next"
    
    for(var i=0; i < ALL_CONSTRAINTS.length-1; i++) {
	if(ALL_CONSTRAINTS[i].constraint == name) {        // found our spot in constraints
	    var next = ALL_CONSTRAINTS[i+1].constraint;    // next constraint is this
	    if(viewConstraints.includes(next)) {
		return(next);                              // the next constraint is relavent
	    }
	    break;                                         // no next so fall through to return
	}
    }

    return(null);
}    

//
// getConstraints() - return an object with all constraints in it. This is normally
//                    only useful when all of the constraints have been specified.
//
function getConstraints()
{
    var viewConstraints = VIEW_DATA[CURRENT_VIEW.name].constraint;

    var returnConstraints = {};

    for(var i=0; i < viewConstraints.length; i++) {
	returnConstraints[viewConstraints[i]] = selectorValue(viewConstraints[i]);
    }

    return(returnConstraints);
}

//
// checkConstraints() - returns true if all constraints have been specified.
//                      False otherwise.
//
function checkConstraints()
{
    var viewConstraints = VIEW_DATA[CURRENT_VIEW.name].constraint;

    for(var i=0; i < viewConstraints.length; i++) {
	if(selectorValue(viewConstraints[i]).length == 0) {
	    return(false);
	}
    }

    return(true);
}

//
// selectorIsMulti() - returns true if the named selector is set at --MULTI--
//
function selectorIsMulti(name)
{
    var selection = $('.constraint-input-' + name).find('div.content');

    if(selection.hasClass('single')) {
	return(false);
    }
	
    return selection.find('select').val() == -1;     // -1 is magical --MULTI-- value
}

//
// selectorValue() - return the value of a given selector. Note that this
//                   can now return an array of values with multi.
//
function selectorValue(name)
{
    var target = $('.constraint-input-' + name);
    var selection = target.find('div.content');

    if(selection.hasClass('single')) {             // a non-selector value just with text - currently blank
	return(selection.find('div').text());
    } else {
	var returnVal = [];
	var dropDownVal = selection.find('select').val();   // gets the current value of the <select> (the #)

	// the "---" has an empty string value - everything else has a value
	if(dropDownVal) {
	    var value;
	    if(dropDownVal == -1) {   // magical constant for -MULTI- selected
		returnVal = multiSelected(name).all;
	    } else {
		returnVal.push(""+dropDownVal);   // ensure string
	    }
	}

	console.log("returning:");
	console.log(returnVal);
	
	return(returnVal);
    }
}

//
// selectorChangeFN() - call this when a selector changes - it will recompute constraints
//                      and enable the GO button if appropriate.
//
function selectorChangeFN(level)
{
    var values = {};

    // gather all of the current values
    
    values.year = selectorValue('year');
    values.robot = selectorValue('robot');
    values.competition = selectorValue('competition');
    values.match = selectorValue('match');

    console.log("selectorChangeFN at level " + level);
    console.log(values);

    // tricky cascade switch - removes the values that need to be re-prompted
    // BUT - this only happens if this field is NOT a multi-select field. If it
    //   is multi select, then leave the lower selections where they are.

    if(!selectorIsMulti(level)) {
	switch(level) {
	case 'year':	delete values.robot;
	case 'robot':	delete values.competition;
	case 'competition':	delete values.match
	case 'match':
	    break;
	}
    }

    switch(level) {
    case 'year':	constraintPopulateDown("robot",values); break;
    case 'robot':       constraintPopulateDown("competition",values); break;
    case 'competition': constraintPopulateDown("match",values); break;
    case 'match':       break;
    }

    selectorGoEnable(checkConstraints());
}

//
// selectorSet() - given the name of a selector, set its value to either a static value
//                 or a list of values. You CAN pass in a list with a single member.
//                 This routine binds a "change" event to the selector, which will
//                 check for sub-contraints, and light those up if needed.
//
function selectorSet(name,values)
{
    var target = $('.constraint-input-' + name);
    var selection = target.find('div.content');

    var multiTarget = $('.constraint-input-multi-' + name);

    console.log("setting " + name);
    
    selection.empty();
    selection.off("change");

    var html = "";

    // take care of the simple case with just a single value (normally words or blank)
    
    if(!Array.isArray(values)) {
	selection.addClass("single");
	html += '<div>' + values + '</div>';
	selection.append(html);
	return;
    }

    // this is the "normal" case where there is one or more values that are used
    
    html += '<select data-selector="' + name + '">';
    if(values.length != 1) {
	html += '<option value="" class="option-non-multi option-none">&nbsp;---&nbsp;</option>';
    }
    if(values.length > 1) {
	html += '<option value="-1" class="option-multi">-MULTI-</option>';
    }
    for(var i=0; i < values.length; i++) {
	html += '<option class="option-non-multi" value="' + values[i] + '">' + values[i] + '</option>';
    }
    html += '</select>';
    selection.removeClass("single");

    selection.append(html);

    if(Array.isArray(values) && values.length > 1) {
	console.log("binding to " + name);
	selection.change(selectorChangeFN.bind(null,name));
    }

    // populate the multi-selection box for each selector

    var multiHTML = "";;
    var multiValues = values;
    if(!Array.isArray(values)) {
	multiValues = [values];
    }

    for(var i=0; i < multiValues.length; i++) {
	multiHTML += '<div class="multi-selection multi-selection-' + name;
	if(isOptionGroup(VIEW_DATA[CURRENT_VIEW.name])) {
	    multiHTML += ' group ';
	}
	multiHTML +=       '"';
	multiHTML +=       'data-constraint="' + name + '" ';
	multiHTML +=       'data-value="' + multiValues[i] + '">';
	multiHTML += multiValues[i];
	multiHTML += '</div>';
    }
    multiTarget.empty();
    multiTarget.append(multiHTML);

    // turn on the multi selector if appropriate

    var multiOnIndicator = $('.multi-on[data-selector="' + name +'"]');
    if(Array.isArray(values) && values.length > 1) {
	multiOnIndicator.show();
    } else {
	multiOnIndicator.hide();
    }
}

function selectorGoEnable(enable)
{
    var target = $('.constraint-input.go');
    if(enable) {
	target.removeClass("disabled");
    } else {
	target.addClass("disabled");
    }
}

function selectorEnable(name,enable)
{
    var target = $('.constraint-input-' + name);
    var selection = target.find('select');

    selection.prop('disabled',enable?false:'disabled');
}

function arrayUnion(a1,a2)
{
    var both = a1.concat(a2);

    for(var i=0; i < both.length; i++) {
	for (var j=i+1; j < both.length; j++) {
	    if(both[i] === both[j]) {
		both.splice(j--,1);
	    }
	}
    }

    return(both);
}

//
// specialRow() - return a row representing the "special requested (currently
//                this is either "average" or "total"). 
//                The current view is used to determine which columns need to
//                be averaged based upon the special indicies.
//
function specialRow(rows,special)
{
    var view = VIEW_DATA[CURRENT_VIEW.name];

    var specialRow = [];

    // initialize the specialRow to nulls - so it always exists

    for(var i=0; i < view.field.length; i++) {
	specialRow.push(null);
    }

    if(view.hasOwnProperty(special)) {

	var indicies = [];

	for(var i=0; i < view[special].length; i++) {
	    var index = findFieldIndex(view[special][i]);
	    if(index < 0) {
		console.log('ERROR: bad ' + special + ' field "' + view[special][i] + '"');
	    } else {
		indicies.push(index);
	    }
	}

	// initialize target fields in row to zero
	
	for(var i=0; i < indicies.length; i++) {
	    var index = indicies[i];
	    specialRow[index] = 0;
	}

	// now calculate the value of the special row, given the data
	
	for(var row=0; row < rows.length; row++) {
	    for(var i=0; i < indicies.length; i++) {
		var index = indicies[i];
		switch(special) {
		case 'average':	specialRow[index] += Number(rows[row][index]); break;
		case 'total':	specialRow[index] += Number(rows[row][index]); break;
		}
	    }
	}

	// finish up for things like "average"
	
	switch(special) {
	case 'average':
	    if(rows.length) {
		for(var i=0; i < indicies.length; i++) {
		    var index = indicies[i];
		    if(specialRow[index] !== null) {
			specialRow[index] /= rows.length;
		    }
		}
	    }
	    break;

	case 'total':
	    break;
	}
    }

    return(specialRow);
}
