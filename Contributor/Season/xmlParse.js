var fs = require('fs');
var xmlp = require('xml2js');
const util = require('util');
var season = undefined;
eval(fs.readFileSync('generateHTML.js')+'');

var parser = new xmlp.Parser();

var contents = fs.readFileSync('exampleSeason.xml', 'utf8');
//console.log(contents);

parser.parseString(contents, function (err, data){
    //console.log(util.inspect(data, false, null, true /* enable colors */));
    season = data;
});

//console.log('I swear to god if this comes before the xml object im gonna kill myself');
console.log('<div style="position:absolute">');
console.log(generateHTML(season));
console.log('</div>');


