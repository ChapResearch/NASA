const { geoSubsetOP, differenceOP, correlateOP } = require('./ac2.js');
const { combineOP, deltaOP } = require('./combineDelta.js');

// the test data is crafted to represent the AC2 field layout along with
//   projected clicks. 'X' is a heatmap click at the time above the click.
//   The letters in [] represent High, Low, Miss with those times below.

//             RED LAUNCH                                                                              RED TERMINAL
//     0         10         20         30         40         50         60         70         80         90         100
//     ,-------------------------------------------------------------------------------------------------------------,
//     |                          .                                                                 ,                |
//  10 |                          .                                                  1              , 20             |
//     |                          .                         -----                    X[LLL]         ,  X[MH]         |
//  20 |                  100     .                   .               .              1,2,4          ,   22,25        |
//     |                  X[L]    .                 /                   \                           ,                |
//  30 |                  101     .                /                     \                          ,,,,,,,,,,,,,,,,,|
//     |...........................              .  32,32                  .                                         |
//  40 |                                            X[MMH]                                                           |
//     |                                             32,32,33                                                        |
//  50 |                                      (               .               )                                      |
//     |                                                                                                             |
//  60 |                                         .                                                                   |
//     |                                                                   .              ...........................|
//  70 |,,,,,,,,,,,,,,,,                           \                    /                 .                          |
//     |            15 ,             28             \                  /                  .    12                    |
//  80 |            X[M]             X[LHM]           .     NEAR     .                    .     X[M]                 |
//     |            16 ,             29,30,31               -----                         .      12                  |
//  90 |               ,                                                                  .                          |
//     |               ,                                                                  .                          |
// 100 '-------------------------------------------------------------------------------------------------------------'
//       BLUE TERMINAL                                                                           BLUE LAUNCH

var nearSpec = [ 'circle', 50, 50, 30, 66 ];
var blueLaunchSpec = [ 'rect', 75,65,25,35 ];            // lower right corner
var redLaunchSpec = [ 'rect', 0,0,25,35 ];               // upper left corner
var blueTerminalSpec = [ 'rect', 0,70,15,30];            // lower left corner
var redTerminalSpec = [ 'rect', 85,0,15,30];             // upper right corner

// this array is entered in sorted order
var testHeatMapData = [
    { event: 1,  x:71 ,y:15 },
    { event: 12, x:81,y:80 },
    { event: 15, x:12,y:80 },
    { event: 20, x:88,y:15 },
    { event: 28, x:27,y:80 },
    { event: 32, x:41,y:40 },
    { event: 32, x:41,y:40 },
    { event: 100,x:18,y:25 },
];

// this array is entered in sorted order
var testEndEvents = [
    { type: 'low', event: 1},
    { type: 'low', event: 2},
    { type: 'low', event: 4},
    { type: 'miss', event: 12},
    { type: 'miss', event: 16},
    { type: 'miss', event: 22},
    { type: 'high', event: 25},
    { type: 'low', event: 29},
    { type: 'high', event: 30},
    { type: 'miss', event: 31},
    { type: 'miss', event: 32},
    { type: 'miss', event: 32},
    { type: 'high', event: 33},
    { type: 'low', event: 101},
];

// create the two heatmap arrays, like with NASA, according to the test data

var testEvents = [];
var testPositions = [];
for(var i=0; i < testHeatMapData.length; i++) {
    testEvents.push(testHeatMapData[i].event);
    testPositions.push({x:testHeatMapData[i].x,y:testHeatMapData[i].y,});
}

// create the end-event arrays
var missArray = testEndEvents.filter((x) => x.type == 'miss').map((x) => x.event);
var highArray = testEndEvents.filter((x) => x.type == 'high').map((x) => x.event);
var lowArray = testEndEvents.filter((x) => x.type == 'low').map((x) => x.event);

console.log("Miss Array",missArray);
console.log("High Array",highArray);
console.log("Low Array",lowArray);

var nearEvents = geoSubsetOP(testEvents,testPositions,...nearSpec);
var blueLaunchEvents = geoSubsetOP(testEvents,testPositions,...blueLaunchSpec);
var redLaunchEvents = geoSubsetOP(testEvents,testPositions,...redLaunchSpec);
var blueTerminalEvents = geoSubsetOP(testEvents,testPositions,...blueTerminalSpec);
var redTerminalEvents = geoSubsetOP(testEvents,testPositions,...redTerminalSpec);

var launchEvents = combineOP(blueLaunchEvents,redLaunchEvents);
var terminalEvents = combineOP(blueTerminalEvents,redTerminalEvents);

var farEvents = differenceOP(testEvents,nearEvents,launchEvents,terminalEvents);

console.log('-------');
console.log("Test Events",testEvents);
console.log("Near Events",nearEvents);
console.log("Launch Events",launchEvents);
console.log("Terminal Events",terminalEvents);
console.log("Far Events",farEvents);

console.log('-------');
console.log('Near High',correlateOP(nearEvents,highArray,testEvents));
console.log('Near Low',correlateOP(nearEvents,lowArray,testEvents));
console.log('Near Miss',correlateOP(nearEvents,missArray,testEvents));
console.log('-------');
console.log('Near High (retest)',correlateOP(nearEvents,highArray,nearEvents,launchEvents,terminalEvents,farEvents));
console.log('-------');
console.log('Far High',correlateOP(farEvents,highArray,testEvents));
console.log('Far Low',correlateOP(farEvents,lowArray,testEvents));
console.log('Far Miss',correlateOP(farEvents,missArray,testEvents));
console.log('-------');
console.log('Launch High',correlateOP(launchEvents,highArray,testEvents));
console.log('Launch Low',correlateOP(launchEvents,lowArray,testEvents));
console.log('Launch Miss',correlateOP(launchEvents,missArray,testEvents));
console.log('-------');
console.log('Terminal High',correlateOP(terminalEvents,highArray,testEvents));
console.log('Terminal Low',correlateOP(terminalEvents,lowArray,testEvents));
console.log('Terminal Miss',correlateOP(terminalEvents,missArray,testEvents));
