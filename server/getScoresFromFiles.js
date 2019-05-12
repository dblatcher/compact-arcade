var path = require('path');
var root = path.dirname(require.main.filename || process.mainModule.filename)
var getJson = require('./getJson.js');


function getScoresFromFiles(games){
	console.log('reading score files');
	console.log('*******************');
	var scores = {};
	games.forEach (game => {
		scores[game.bundle] = [];
		if (game.scoresFileName) {
			scores[game.bundle] = getJson(game.scoresFileName,'./score-data/');
		}
		
	})
	console.log('*******************');
	return scores;
}


module.exports = getScoresFromFiles;