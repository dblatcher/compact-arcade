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

export {createGame, pageSettings, initialiseForPage };