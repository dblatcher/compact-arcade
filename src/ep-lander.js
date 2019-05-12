import { createGame, pageSettings, initialiseForPage, appendScoreFunctionsToPageSettings} from './js/base.js';

import { backgroundStars } from './js/discs/backgroundStars.js'
import { vectorGraphics } from './js/discs/vectorGraphics.js'
import { vectorCalculations } from './js/discs/vectorCalculations.js'
import { vectorPhysics } from './js/discs/vectorPhysics.js'
import { landerGame } from './js/discs/landerGame.js'
import { landerGameLevels } from './js/discs/landerGameLevels.js'

var gameInstance = createGame([backgroundStars,vectorGraphics,vectorCalculations,vectorPhysics,landerGame,landerGameLevels],{
	startingLives:2,
	runCollisionTestInMainLoop:false,
	bottomOfScreenIsZeroY : false,
	gameCycleTime : 10,
	cyclesForLevelScreen : 50,
});

appendScoreFunctionsToPageSettings('lander', pageSettings) 

initialiseForPage(gameInstance, pageSettings);