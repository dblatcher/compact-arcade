import { createGame, pageSettings, initialiseForPage, appendScoreFunctionsToPageSettings} from './js/base.js';

import { backgroundStars } from './js/discs/backgroundStars.js'
import { vectorGraphics } from './js/discs/vectorGraphics.js'
import { vectorCalculations } from './js/discs/vectorCalculations.js'
import { vectorPhysics } from './js/discs/vectorPhysics.js'
import { vectorGame } from './js/discs/vectorGame.js'
import { vectorGameLevels } from './js/discs/vectorGameLevels.js'
import { vectorGameLibrary } from './js/discs/vectorGameLibrary.js';

var gameInstance = createGame([backgroundStars,vectorGraphics,vectorCalculations,vectorPhysics,vectorGameLibrary,vectorGame,vectorGameLevels],{
	startingLives:3,
	runCollisionTestInMainLoop:false,
	bottomOfScreenIsZeroY : false,
	gameCycleTime : 10
});

	
appendScoreFunctionsToPageSettings('spacegame', pageSettings) 

initialiseForPage(gameInstance, pageSettings);
