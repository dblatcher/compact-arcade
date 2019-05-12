import { createGame } from './gameTemplate.js'
//var Promise = require('es6-promise').Promise;



var pageSettings = {
  canvasElement:document.getElementById("gameSpace"),
  assetHolderElement:document.getElementById("assetStore"),
  enableTouch:false,
  soundPath :'assets/sounds/',
  spritePath :'assets/sprites/',
}

function initialiseForPage (game, settings) {
  game.initialise(settings);
  if (document.body.getAttribute('page-role') === 'debug') {
    console.log('running game in debug mode.');
    document.gameInstance = game;
  }
}

const appendScoreFunctionsToPageSettings = function (gameName, settingsObject) {
	
	if (document.body.getAttribute('page-role') === 'debug') {
		return settingsObject;
	}
	
	var axios = require('axios');

	const fetchScores = function() {
		return new Promise(function(resolve, reject) {
			axios.get('scores/'+gameName)
				.then(function(response) {
					if (response.status == 200) {
						resolve({success:true, data:response.data});
					};
					reject (response.data.message);
				})
				.catch(function(response) {
					console.log(response);
					reject ('error');
				}); 
		});
	};

	const sendScore = function(newScore) {
		return new Promise (function (resolve, reject) {
			axios.post('scores/'+gameName, newScore)
				.then (function(response) {
					if (response.status == 200) {
						resolve({success:true, data:response.data});
					};
					reject (response.data.message);
				})
				.catch(function(response) {
					reject ('error');
				});
		});	
	}	
		
	settingsObject.fetchScoreFunction = fetchScores,
	settingsObject.sendScoreFunction = sendScore
	
	return settingsObject;
}
	


export {createGame, pageSettings, initialiseForPage, appendScoreFunctionsToPageSettings };