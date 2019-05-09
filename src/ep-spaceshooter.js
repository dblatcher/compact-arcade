import { createGame, pageSettings, initialiseForPage} from './js/base.js';

import { spriteHandling } from './js/discs/spriteHandling.js'
import { spaceShooter } from './js/discs/spaceshooter.js'

var gameInstance = createGame([spriteHandling,spaceShooter],{
	leftOffset:150,
	startingLives:0,
	runCollisionTestInMainLoop:true,
	bottomOfScreenIsZeroY : true,
});

initialiseForPage(gameInstance, pageSettings);