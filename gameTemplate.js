
function createGame () {
	var game = {
		timer:0, cycleCount:0, numberOfCyclesBetweenCheckingLevelEnds:10, 
		keyMap:{}, startingLives:0,
		soundFiles: [], spriteFiles:[],
		
		level: [ 
		{width:1000,height:1000,
			items:[],
			effects:[{type:'message',message:'empty game', animateFrame:0, lastFrame:-1}],
			victoryCondition() {
				return false;
			}
		}
		],
		
		sound : {
			path : "./sounds/",
			play(choosenSound) {
				this[choosenSound].play();
			},
			stop(choosenSound) {
				this[choosenSound].pause();
			}
		},
		
		sprite : {
			path : "./sprites/",
		},
		
		make : {},
		
		calc : {},
		
	};
	
	game.session = {
			items : [],
			effect:[],
			player:{},
			currentLevel : 0,
			score:0,
			lives:2,
			waitingToReset:false,
			gameStatus:'none',
			highscoreName:'',
			reset() {
				this.score = 0;
				this.lives = game.startingLives;
				this.highscoreName = '';
				this.gameStatus = 'play';
				this.player ={};
				game.setUpLevel(0);
			}
		};
	
	game.initialise = function(outputs) {
		this.canvasElement = outputs.canvasElement;
		this.scoreElement = outputs.scoreElement || 0;
		this.sendScore = outputs.sendScoreFunction 
			|| function(){console.log('No sendScoreFunction was defined in call to initialise - can\'t send highscore. ')};
		
		document.onkeydown = document.onkeyup = function(e){
			e = e || event; // to deal with IE
			game.keyMap[e.key] = e.type == 'keydown';
		}
		
		window.onblur = function() {
			game.keyMap={}; 	
			clearInterval(game.timer);
		};
		window.onfocus = function() {
			game.timer = setInterval(function(){game.refresh()},25);
		};

		for(var loop=0; loop < this.soundFiles.length; loop++) {
			addSound(this.soundFiles[loop]);
		};
		for(var loop=0; loop < this.spriteFiles.length; loop++) {
			addSprite(this.spriteFiles[loop]);
		};
					
		this.session.reset();			
		this.timer = setInterval(function(){game.refresh()},25);
		
		function addSound(src) {
			var soundElement;
			soundElement = document.createElement("audio");
			soundElement.src = game.sound.path+src;
			soundElement.setAttribute("preload", "auto");
			soundElement.setAttribute("controls", "none");
			soundElement.style.display = "none";
			document.body.appendChild(soundElement);
			game.sound[src] = soundElement;
		};
		function addSprite(src) {
			var spriteElement;
			SpriteElement = document.createElement("img");
			SpriteElement.src = game.sprite.path+src;
			SpriteElement.style.display = "none";
			document.body.appendChild(SpriteElement);
			game.sprite[src] = SpriteElement;
		};
		
	};
	
	game.customNewLevelAction = function(){};
	
	game.setUpLevel = function(level) {
		var effectClone, init;
		if (level !== game.session.currentLevel || level === 0 ) {
			this.customNewLevelAction(level);
		}
		game.session.currentLevel = level;
		this.session.items = [];
		for (init = 0; init < this.level[level].items.length; init++) {
			this.session.items.push(this.make[this.level[level].items[init].func](this.level[level].items[init].spec));
			if (this.level[level].items[init].isPlayer) {this.session.player = this.session.items[this.session.items.length-1]};
		};
					
		this.session.effect = [];
		if (this.level[level].effects) {
			for (init = 0; init < this.level[level].effects.length; init++) {
				effectClone = JSON.parse(JSON.stringify(this.level[level].effects[init]));
				this.session.effect.push( effectClone );
			};
		};
		game.keyMap ={};
		game.cycleCount = 0;
	};
	
	game.refresh = function() {
		var timeStamp = new Date();
		
		if (this.session.gameStatus === 'play') {
			if (this.session.player.dead === false) {this.reactToControls()};
			this.runItemActions();
			this.session.items = this.session.items.filter(function(item){return item.dead==false});
			if (game.cycleCount % game.numberOfCyclesBetweenCheckingLevelEnds === 0 || game.session.currentLevel === 0 ) {
				this.checkIfLevelFinished();
				if (game.session.player.dead == true && game.session.waitingToReset === false) {
					this.handleDeadPlayer();
				};			
			};
			game.cycleCount++;
		} 			
		
		if (this.session.gameStatus === 'highscoreEntry') {
			this.reactToHighscoreEntry();
		}

		this.renderScreen();
		
		timeStamp = new Date() - timeStamp; 
		//	if (timeStamp > 24) console.log('long cycle:' + timeStamp);
		clearInterval(game.timer);
		game.timer = setInterval(function(){game.refresh()},(25-timeStamp > 0 ? 25-timeStamp : 1) );
	};
	
	game.runItemActions = function(){},
	
	game.reactToHighscoreEntry = function() {
		var entryCharacters = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",loop,letter;
		for (loop=0;loop<entryCharacters.length;loop++) {
			letter = entryCharacters.charAt(loop);
			if (this.keyMap[letter]) {
				this.keyMap[letter] = false;
				game.session.highscoreName += letter;
			}
		}
		if (this.keyMap['Backspace']) {
			this.keyMap['Backspace'] = false;
			game.session.highscoreName = game.session.highscoreName.slice(0,game.session.highscoreName.length-1);
		}
		if (this.keyMap['Enter']) {
			this.keyMap['Enter'] = false;
			this.sendScore(game.session.highscoreName, game.session.score);
			game.session.reset();
		}
	};
		
	game.renderScreen = function() {
			var c = this.canvasElement;	var ctx = c.getContext("2d");
			var effect,rgbString, plotOffset = {}, statusLineText='', highscoreNameText='';
			
			if (this.scoreElement) {
				if (this.session.currentLevel === 0) {
					this.scoreElement.style.display = 'block';
				} else {
					this.scoreElement.style.display = 'none';
				}
			}
			
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,c.width,c.height);
			ctx.lineWidth = 1;
			
			plotOffset.x = Math.min(game.level[game.session.currentLevel].width-1000,Math.max(this.session.player.x-500,0)) || 0;
			plotOffset.y = Math.min(game.level[game.session.currentLevel].height-1000,Math.max(this.session.player.y-500,0)) || 0;			
			
			this.renderBackground(plotOffset);
			
			if (this.session.gameStatus === 'play') {
				for (p=0;p<this.session.items.length;p++) {
					if (this.session.items[p].dead == false) {
						this.session.items[p].render(ctx,plotOffset)
					}
				}			

				for (p=0;p<this.session.effect.length;p++) {
					effect = this.session.effect[p];
					ctx.lineWidth = 1;
					if (effect.type == 'expandingRing'){
						ctx.beginPath();
						ctx.arc(effect.x- plotOffset.x,effect.y- plotOffset.y,1+effect.animateFrame,0,2*Math.PI);
						rgbString = 'rgb(' + (250-(effect.animateFrame*4.5)) + ',' + (250-(effect.animateFrame*4.5)) + ',' + (250-(effect.animateFrame*4.5)) + ')';
						ctx.strokeStyle = rgbString;
						ctx.lineWidth = 2;
						ctx.stroke();
					}
					if (effect.type == 'sparks') {
						ctx.beginPath();
						ctx.fillStyle = 'red';
						for (pp=0;pp<20;pp++){
							ctx.fillRect(
								effect.x+(Math.random()*30)-15 - plotOffset.x,
								effect.y+(Math.random()*30)-15 - plotOffset.y,
								2,2
							);
						}
						ctx.stroke();
					}
					if (effect.type === 'message' && effect.message) {
						ctx.beginPath();
						ctx.font = "10vh arial";
						ctx.fillStyle = "red";
						ctx.textAlign = "center";
						ctx.fillText(effect.message, c.width/2, c.height/2);					
					}
					
					effect.animateFrame++;			
				}
				function checkEffectNotFinished(item) {return (item.animateFrame <= item.lastFrame || item.lastFrame === -1)}
				this.session.effect = this.session.effect.filter(checkEffectNotFinished);
			}
			
			if (this.session.gameStatus === 'highscoreEntry') {
				ctx.beginPath();
				ctx.font = "4vh sans-serif";
				ctx.fillStyle = "red";
				ctx.textAlign = "center";
				ctx.textBaseline="top";

				ctx.fillText('ENTER NAME', c.width/2, c.height*(0.25));

				ctx.font = "18vh sans-serif";
				ctx.fillStyle = "red";
				ctx.textAlign = "center";
				ctx.textBaseline="top";			
				ctx.fillText(this.session.highscoreName, c.width/2, c.height*(0.50));
			}
			
			statusLineText = 'Lives: ' + game.session.lives + ' Score: ' + game.session.score;
			ctx.beginPath();
			ctx.font = "3vh sans-serif";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";
			ctx.textBaseline="top";

			ctx.fillText(statusLineText, 10, 10);
			
		};
	
	game.renderBackground = function(){};
			
	game.checkIfLevelFinished = function () {
		if (this.level[this.session.currentLevel].victoryCondition() === true) {
			if (this.level[this.session.currentLevel].score) {this.session.score += this.level[this.session.currentLevel].score}
			if (this.session.currentLevel+1 < this.level.length) { this.setUpLevel(this.session.currentLevel+1)}
			else {
				game.session.effect.push ({type:'message',message:'You win!', animateFrame:0, lastFrame:3000/25});
				game.session.waitingToReset = true;
				game.session.player={};
				setTimeout(function() {
					game.session.waitingToReset = false;
					game.session.gameStatus = 'highscoreEntry';
				},3000);
			};
			return true;
		}
		return false;
	};
		
	game.handleDeadPlayer = function () {
			if (game.session.lives-- > 0) {
				game.session.waitingToReset = true;
				setTimeout(function() {
					game.session.waitingToReset = false;
					game.setUpLevel(game.session.currentLevel);
				},2500);
			} else {
				game.session.effect.push ({type:'message',message:'Game Over!', animateFrame:0, lastFrame:3000/25});
				game.session.waitingToReset = true;
				game.session.player={};
				setTimeout(function() {
					game.session.waitingToReset = false;
					game.session.gameStatus = 'highscoreEntry';
				},3000);
			};	
			return true;
		};
		

	return game;
}




