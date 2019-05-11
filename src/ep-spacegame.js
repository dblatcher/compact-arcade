import { createGame, pageSettings, initialiseForPage, appendScoreFunctionsToPageSettings} from './js/base.js';

import { backgroundStars } from './js/discs/backgroundStars.js'
import { vectorGraphics } from './js/discs/vectorGraphics.js'
import { vectorCalculations } from './js/discs/vectorCalculations.js'
import { vectorPhysics } from './js/discs/vectorPhysics.js'
import { vectorGame } from './js/discs/vectorGame.js'
import { vectorGameLevels } from './js/discs/vectorGameLevels.js'

var gameInstance = createGame([backgroundStars,vectorGraphics,vectorCalculations,vectorPhysics,vectorGame,vectorGameLevels],{
	startingLives:3,
	runCollisionTestInMainLoop:false,
	bottomOfScreenIsZeroY : false,
	gameCycleTime : 10
});

console.log (
appendScoreFunctionsToPageSettings('scores_spacegame.json', pageSettings) 
);
console.log ( pageSettings);



initialiseForPage(gameInstance, pageSettings);
