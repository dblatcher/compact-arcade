var express = require('express');
var ScoreRouter = express.Router();
var path = require('path');

var saveJson = require('../saveJson.js');
var getJson = require('../getJson.js');


var root = path.dirname(require.main.filename || process.mainModule.filename)
console.log('root',root);


var router = function(games) {


	function getFileName(gameName) {
		for (var i = 0; i<games.length; i++) {
			if (games[i].bundle === gameName) {
				return ( games[i].scoresFileName || false );
			}
		}
		return false;
	}

	
	ScoreRouter.route('/:name')
		.get(function (req, res){
			var fileName = getFileName(req.params.name);
			if (!fileName) {
				console.log('no file name');
				res.send('no file name');
			};
			
			console.log('fileName',fileName);
			res.sendFile(root+'/score-data/'+fileName);
		});
	
	ScoreRouter.route('/:name')
		.post(function (req, res){
			var fileName = getFileName(req.params.name);
			if (!fileName) {
				console.log('no file name');
				res.send('no file name');
			};
		
			var data = getJson(fileName,'./score-data/');
			var newScore = {score:data.length, name:'fake data'};
			data.push(newScore);		
			
			saveJson(fileName, './score-data/', data)
			.then ( (results) => {
				console.log(results, data);
			})
			.catch( (error)   => {console.log(error)});
			
			res.send(JSON.stringify(data));
		});
	
	return ScoreRouter;

}	
	
	
	
module.exports = router;