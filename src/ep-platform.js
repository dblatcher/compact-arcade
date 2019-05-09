import { createGame, pageSettings, initialiseForPage} from './js/base.js';

import { spriteHandling } from './js/discs/spriteHandling.js'
import { platformGame } from './js/discs/platforms.js'

var gameInstance = createGame([spriteHandling,platformGame],{
	startingLives:1,
	runCollisionTestInMainLoop:true,
	bottomOfScreenIsZeroY : true,
	gameCycleTime : 25
});

initialiseForPage(gameInstance, pageSettings);