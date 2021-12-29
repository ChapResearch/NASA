//
// seasonFile.js
//
//   Includes the code to load the appropriate season data.
//

var fetch = require('node-fetch');

const SeasonDir = "NASA/Season/";      // firebase storage dir where the season files are kept
const SeasonFile = "SEASONFILE";       // name of the file (in the above) where the *actual*
                                       //   XML file name is stored. Change this to point to the
                                       //   right one.
module.exports = {
    seasonFile: function (firebase,json = false) { return(seasonFile(firebase,json)); },
    seasonDir: function() { return(SeasonDir); }
};

//
// seasonFile() - returns a promise that provides a ref to the appropriate
//                season XML or JSON file that was generated from the season XML file.
//                By default, the XML file ref is returned.  If true is given, then
//                the JSON file is returned.
//
function seasonFile(firebase,json)
{
    var storage = firebase.storage();
    var ref = storage.ref(SeasonDir + SeasonFile);

    return ref.getDownloadURL()
	.then((url) => fetch(url))
	.then((body) => body.text())
	.then((xmlFile) => {
	    var baseName = xmlFile.split(".")[0];
	    var jsonFile = baseName + ".json";
	    var target = json?jsonFile:xmlFile;
	    return(storage.ref(SeasonDir + target));
	})
	.catch((err) => {
	    console.log("error getting SEASONFILE pointer - it must point to the appropriate XML file: " + err);
	});
}

