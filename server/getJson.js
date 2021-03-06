fs = require("fs");

function getJsonData(fileName, path) {
	var files = fs.readdirSync(path);
	var json = [];

	for (var i = 0; i<files.length; i++) {
		if (files[i] === fileName) {
			try {
				console.log(`Reading data from ${fileName}...`)
				json = (
					JSON.parse(fs.readFileSync(path + '/' + files[i], 'utf8'))
				);
				return json;
			} catch(err) {
				console.log(`Error in json file for the ${files[i]}!`);
				console.log(err)
				return json;
			}
		};
	}
	
	console.log(`file ${fileName} not found in ${path}`)
	return json;

};

module.exports = getJsonData;