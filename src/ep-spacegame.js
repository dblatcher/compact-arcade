import { createGame, pageSettings, initialiseForPage} from './js/base.js';

import { backgroundStars } from './js/discs/backgroundStars.js'
import { vectorGraphics } from './js/discs/vectorGraphics.js'
import { vectorCalculations } from './js/discs/vectorCalculations.js'
import { vectorPhysics } from './js/discs/vectorPhysics.js'
import { vectorGame } from './js/discs/vectorGame.js'

var gameInstance = createGame([backgroundStars,vectorGraphics,vectorCalculations,vectorPhysics,vectorGame],{
	startingLives:3,
	runCollisionTestInMainLoop:false,
	bottomOfScreenIsZeroY : false,
	gameCycleTime : 10
});

initialiseForPage(gameInstance, pageSettings);
