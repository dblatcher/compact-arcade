var express = require('express');
var ScoreRouter = express.Router();
var path = require('path');

var root = path.dirname(require.main.filename || process.mainModule.filename)
var saveJson = require('../saveJson.js');
var getJson = require('../getJson.js');


var router = function(games, scores) {


	function getFileName(gameName) {
		for (var i = 0; i<games.length; i++) {
			if (games[i].bundle === gameName) {
				return ( games[i].scoresFileName || false );
			}
		}
		return false;
	};
	
	function makeNoTableError(param){
		return JSON.stringify({ error: 'no score table', message: `no score table for a game called ${para}`})
	}; 

	
	ScoreRouter.route('/:name')
		.get(function (req, res){
			var gameName = req.params.name
			
			if (!scores[gameName]) {
				res.status(406).send(makeNoTableError(gameName));
				return;
			}
			
			res.send(JSON.stringify(scores[gameName]));			
		});
	
	ScoreRouter.route('/:name')
		.post(function (req, res){
			var gameName = req.params.name
			
			if (!scores[gameName]) {
				res.status(406).send(makeNoTableError(gameName));
				return;
			};
			
			var scoreTable = scores[gameName];
			var postedScore = req.body;
			console.log ('incoming score for' + gameName,postedScore);
			
			
			var validationProblems = [];
			if (typeof postedScore.name !== 'string') {validationProblems.push('invalid or missing name')};	
			if (typeof postedScore.score !== 'number') {validationProblems.push('invalid or missing score')};	
			
			
			if (validationProblems.length) {
				res.send(JSON.stringify({
					error: 'bad data',
					message: `score data posted for ${gameName} was bad: ${validationProblems.toString()}`
				}));
				return;
			}
			
			scoreTable.push(postedScore);
			res.send(JSON.stringify(scoreTable));

		});
	
	return ScoreRouter;

}	
	
	
	
module.exports = router;