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
	
	
	var dummyScoreData = [
	{name: 'Joe', score: 500, date: new Date(1550000000012)},
	{name: 'Tim', score: 2500, date: new Date(1550000000110)},
	{name: 'Bob', score: 300, date: new Date(1550000000050)},
	{name: 'Joe', score: 1500, date: new Date(1550000000100)},
	{name: 'Joe', score: 15, date: new Date(1550000000002)},
	{name: 'Joe', score: 20, date: new Date(1550000000001)}
	];

	const fetchScores = function() {
		console.log('fetch score request received for ' + gameName)
		return new Promise(function(resolve, reject) {
	// will be promise sending new score to server to put in {gameName}		
			setTimeout(function() {
				if (true) {
					resolve({success:true, data:dummyScoreData});
				} else {
					reject ('error');
				}		
			}, 4000);
		});
	};

	const sendScore = function(newScore) {
		console.log('new score received for ' + gameName+' : ', newScore);
		return new Promise (function (resolve, reject) {
	// will be promise asking server to send data from {gameName}
			setTimeout(function() {
				if (true) {
					dummyScoreData.push(newScore);
					resolve({success:true, data:dummyScoreData});
				} else {
					reject ('error');
				}
			},4000);
		});	
	}	
		
	settingsObject.fetchScoreFunction = fetchScores,
	settingsObject.sendScoreFunction = sendScore
	
	return settingsObject;
}
	
 

export {createGame, pageSettings, initialiseForPage, appendScoreFunctionsToPageSettings };