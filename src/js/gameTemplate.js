function createGame (disks, options) {
	
	if (typeof(options) !==  "object") {options = {} };
	options.leftOffset = options.leftOffset || 500;
	options.startingLives = options.startingLives || 1;
	options.msPerGameCycle = options.msPerGameCycle || 25
	options.cyclesBetweenDeathAndReset = options.cyclesBetweenDeathAndReset || 40;
	options.cyclesBetweenLevelEndAndReset = options.cyclesBetweenLevelEndAndReset || 40;
	options.cyclesForLevelScreen = options.cyclesForLevelScreen || 50;

	if (typeof(options.bottomOfScreenIsZeroY) === 'undefined' ) {
		options.bottomOfScreenIsZeroY = true;
	};
	if (typeof(options.runCollisionTestInMainLoop) === 'undefined' ) {
		options.runCollisionTestInMainLoop = true;
	};
	
	var game = {
		timer:0, cycleCount:0, numberOfCyclesBetweenCheckingLevelEnds:10, 
		keyMap:{}, startingLives:options.startingLives,
		soundFiles: [], spriteFiles:[],
		
		level: [ 
		{width:1000,height:1000,
			items:[],
			effects:[
				{ func:'message',spec:{message:'empty game'} }
			],
			victoryCondition : function() {
				return false;
			}
		}
		],
		
		sound : {
			play: function(choosenSound) {
				this[choosenSound].play();
			},
			stop: function(choosenSound) {
				this[choosenSound].pause();
			}
		},
		
		sprite : {},
		make : {},
		makeEffect : {},
		calc : {},
		session: {},				
		canvasElement : null,
		assetHolderElement : null,
		localScores : [],
		fallbackScores : [],
		lastScore : null, 
		widgets :[],
		library : {
			defaultWidgets:{
				
				barChart : function(c,ctx,plotOffset) {
					var margin = this.margin || 0;
					var barLevel = (this.height - 2*margin)*(this.getValue() / this.getRange());
					var barFill;
					if (typeof this.barFill === "function") {
						barFill = this.barFill(barLevel,ctx)
					} else {barFill=this.barFill};
					var chartFill;
					if (typeof this.chartFill === "function") {
						chartFill = this.chartFill(barLevel,ctx)
					} else {chartFill=this.chartFill};
					
					ctx.beginPath();
					ctx.fillStyle = chartFill;
					ctx.rect(this.xPos,this.yPos,this.width,this.height);
					ctx.fill();
					ctx.beginPath();
					ctx.fillStyle = barFill;
					ctx.rect(this.xPos +margin,this.yPos+this.height-barLevel-margin,this.width - 2*margin,barLevel);
					ctx.fill();
				},
	
				circleChart : function(c,ctx,plotOffset) {
					var barLevel = (this.height/2 - this.margin)*(this.getValue() / this.getRange());
					if (barLevel<0){barLevel = 0;}
					
					var barFill;
					if (typeof this.barFill === "function") {
						barFill = this.barFill(barLevel,ctx)
					} else {barFill=this.barFill};
					var chartFill;
					if (typeof this.chartFill === "function") {
						chartFill = this.chartFill(barLevel,ctx)
					} else {chartFill=this.chartFill};
					
					ctx.beginPath();
					ctx.fillStyle = chartFill;
					ctx.arc(this.xPos+this.height/2,this.yPos+this.height/2,this.height/2,0, Math.PI*2);
					ctx.fill();
					ctx.beginPath();
					ctx.fillStyle = barFill;
					
					ctx.arc(this.xPos+this.height/2,this.yPos+this.height/2,barLevel,0, Math.PI*2);
					ctx.fill();
				},
				
				statusLine : function(c,ctx,plotOffset){
					ctx.beginPath();
					var font = this.font || "sans-serif";
					var textSize = this.textSize || 3/100;
					ctx.font = (textSize * c.height) +"px "+ font;
					ctx.fillStyle = this.color || "white";
					ctx.textAlign = "left";
					ctx.textBaseline = "top";
					ctx.fillText(this.getStatus(), 10, 10);
				},
				
				showText : function(c, ctx, plotOffset) {
					ctx.beginPath();
					var font = this.font || "sans-serif";
					var textSize = this.textSize || 3/100;
					ctx.font = (textSize * c.height) +"px "+ font;
					ctx.fillStyle = typeof this.color === 'function' ?
						this.color() :
						this.color || "white";
					ctx.textAlign = this.textAlign || "left";
					ctx.textBaseline = this.textBaseline || "top";
					ctx.fillText(this.getText(), this.xPos, this.yPos);
				}
			}
			
		}
	};
	

	
	game.ongoingTouches = [];
	game.swipeDirection = {x:0,y:0};
	game.swipeDelay = {x:0,y:0,pause:5};
	
	game.touchButtons = [
		{name:'fire',type:'hold',x:800,y:800,r:50},
		{name:'jump',type:'click',x:800,y:600,r:50}
	];
	
	game.touch = {
		copy : function(touch){
			return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, status:touch.status };
		},
		
		indexById : function (idToFind) {
		  for (var i = 0; i < game.ongoingTouches.length; i++) {
				var id = game.ongoingTouches[i].identifier;
				if (id == idToFind) {
					return i;
				}	
			}
		},
		
		position : function(touch) {
			var rect = game.canvasElement.getBoundingClientRect(),
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
			scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			
			var elementPos = {
				x:touch.pageX - rect.left,
				y:touch.pageY - rect.top
			};
			
			return {
				x: elementPos.x*game.canvasElement.width/rect.width,
				y: elementPos.y*game.canvasElement.height/rect.height,
			}
		},
		
		handleStart : function(evt){
			evt.preventDefault();
			var touches = evt.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				touches[i].status = {button:null,xMove:0,yMove:0,xDirection:0,yDirection:0,isDirectional:false};	
				for (var j = 0; j< game.touchButtons.length; j++) {
					if (game.calc.distance(game.touchButtons[j], game.touch.position(touches[i])) < game.touchButtons[j].r) {
						touches[i].status.button = game.touchButtons[j];
					}
				}
				
				if (!touches[i].status.button) {
					touches[i].status.isDirectional = true;
				}
				
				game.ongoingTouches.push(game.touch.copy(touches[i]));
			}
		},
		
		handleEnd : function(evt){
			evt.preventDefault();
			var touches = evt.changedTouches;
			for (var i = 0; i < touches.length; i++) {
				var idx = game.touch.indexById(touches[i].identifier);
				if (idx >= 0) {
					if (game.ongoingTouches[idx].status.isDirectional) {game.swipeDirection.x=0; game.swipeDirection.y=0}
					game.ongoingTouches.splice(idx, 1);  // remove it; we're done
				} 
			}
		},
		
		handleCancel : function(evt){
			evt.preventDefault();
			console.log("touchcancel.");
			var touches = evt.changedTouches;
			
			for (var i = 0; i < touches.length; i++) {
				var idx = game.touch.indexById(touches[i].identifier);
				game.ongoingTouches.splice(idx, 1);  // remove it; we're done
			}
		},
		
		handleMove : function(evt){
			evt.preventDefault();
			var touches = evt.changedTouches, oldPosition,newPosition;
			var moveThreshold = 10;
			
			for (var i = 0; i < touches.length; i++) {
				var idx = game.touch.indexById(touches[i].identifier);
				if (idx >= 0) {								
					oldPosition = game.touch.position(game.ongoingTouches[idx]);
					newPosition = game.touch.position(touches[i]);		
					touches[i].status = game.ongoingTouches[idx].status;
					touches[i].status.xMove = newPosition.x - oldPosition.x;
					touches[i].status.yMove = newPosition.y - oldPosition.y;
					
					if (touches[i].status.isDirectional) {
						if (!game.swipeDelay.x) {
							if (touches[i].status.xMove > moveThreshold && game.swipeDirection.x < 1 ) {game.swipeDirection.x++;game.swipeDelay.x = game.swipeDelay.pause;}
							if (touches[i].status.xMove <-moveThreshold && game.swipeDirection.x >-1 ) {game.swipeDirection.x--;game.swipeDelay.x = game.swipeDelay.pause;}
						}
						if (!game.swipeDelay.y) {
						if (touches[i].status.yMove > moveThreshold && game.swipeDirection.y < 1 ) {game.swipeDirection.y++;game.swipeDelay.y = game.swipeDelay.pause;}
						if (touches[i].status.yMove <-moveThreshold && game.swipeDirection.y >-1 ) {game.swipeDirection.y--;game.swipeDelay.y = game.swipeDelay.pause;}
						}
					};
					
					if (touches[i].status.button) {					
						if (game.calc.distance(touches[i].status.button, newPosition) >= touches[i].status.button.r) {
							touches[i].status.button = null;
						}
					};
								
					game.ongoingTouches.splice(idx, 1, game.touch.copy(touches[i]));  // swap in the new touch record
				} 
			}
		},
	},
	
	
	game.session = {
		paused: false,
		items : [],
		effect:[],
		player:{},
		environment:{},
		currentLevel : 0,
		score:0,
		lives:2,
		waitingToReset:false,
		resetTime:false,
		gameStatus:'none',
		highscoreName:'',
		reset:function() {
			this.score = 0;
			this.lives = game.startingLives;
			this.highscoreName = '';
			this.gameStatus = 'titleScreen';
			this.player ={};
			this.currentLevel = 0;
			game.cycleCount = 0;
		}
	};
	
	game.initialise = function(outputs) {
		this.canvasElement = outputs.canvasElement;
		this.assetHolderElement = outputs.assetHolderElement || document.body;
				
		// the 'spoof' object is a security feature
		// prevents the page-supplied fetchScoreFunction having access to game object as 'this'
		this.spoof = {remoteScores:[], pending:false};
		this.spoof.fetchScore = outputs.fetchScoreFunction || false;
		this.spoof.sendScore =  outputs.sendScoreFunction || false;

		Object.defineProperty(this, 'remoteScores', {
			get: function() { return this.spoof.remoteScores},
			set: function(v) {this.spoof.remoteScores = v}
		});
		Object.defineProperty(this, 'fetchScoreIsPending', {
			get: function() { return this.spoof.pending},
			set: function(v){this.spoof.pending = v}
		});
		
		if (typeof outputs.fixedScoreData === 'object') {
			if (outputs.fixedScoreData.length) {
				if (typeof outputs.fetchScoreFunction !== 'function') {
					this.remoteScores = this.remoteScores.concat(outputs.fixedScoreData);
				} else {
					this.fallbackScores = outputs.fixedScoreData;
				}
			}
		};
		
		if (typeof this.spoof.fetchScore === 'function') {
			game.handleFetchingScore();
		}
		
		var soundPath  = outputs.soundPath || './'
		var spritePath = outputs.spritePath ||'./'
			
		document.onkeydown = document.onkeyup = function(e){
			e = e || event; // to deal with IE
			game.keyMap[standardiseKey(e.key)] = e.type == 'keydown';
			function standardiseKey(key) {
				if (key === 'Left') {return 'ArrowLeft'};
				if (key === 'Right') {return 'ArrowRight'};
				if (key === 'Down') {return 'ArrowDown'};
				if (key === 'Up') {return 'ArrowUp'};
				if (key === 'Spacebar') {return ' '};
				if (key === 'Del') {return 'Delete'};
				return key;
			}
		}
	
		if (outputs.enableTouch) {		
			game.enableTouch = true;
			this.canvasElement.addEventListener("touchstart", game.touch.handleStart, false);
			this.canvasElement.addEventListener("touchend", game.touch.handleEnd, false);
			this.canvasElement.addEventListener("touchcancel", game.touch.handleCancel, false);
			this.canvasElement.addEventListener("touchmove", game.touch.handleMove, false);
		}		
		
		window.onblur = function() {
			game.keyMap={};
			game.session.paused = true;
			
		};
		window.onfocus = function() {
			game.session.paused = false;
			game.timer = setTimeout(function(){game.refresh()},options.msPerGameCycle);
		};

		for(var loop=0; loop < this.soundFiles.length; loop++) {
			addSound(this.soundFiles[loop]);
		};
		for(var loop=0; loop < this.spriteFiles.length; loop++) {
			addSprite(this.spriteFiles[loop]);
		};
					
		this.session.reset();			
		this.timer = setTimeout(function(){game.refresh()},options.msPerGameCycle);
		
		this.widgets.push({
			render: game.library.defaultWidgets.statusLine,
			getStatus : function(){return 'Lives: ' + game.session.lives + ' Score: ' + game.session.score;}
		})
		
		function addSound(src) {
			var soundElement;
			soundElement = document.createElement("audio");
			soundElement.src = soundPath+src;
			soundElement.setAttribute("preload", "auto");
			soundElement.setAttribute("controls", "none");
			soundElement.style.display = "none";
			game.assetHolderElement.appendChild(soundElement);
			game.sound[src] = soundElement;
		};
		function addSprite(src) {
			var spriteElement;
			SpriteElement = document.createElement("img");
			SpriteElement.src = spritePath+src;
			SpriteElement.style.display = "none";
			game.assetHolderElement.appendChild(SpriteElement);
			game.sprite[src] = SpriteElement;
		};
		
	};
		
	game.setUpLevel = function(levelNumber) {
		var init, level;
		if (levelNumber !== game.session.currentLevel || levelNumber === 0 ) {
			this.customNewLevelAction(levelNumber);
		}
		game.session.currentLevel = levelNumber;
		this.session.items = [];
		level = this.level[levelNumber];
		
		for (init = 0; init < level.items.length; init++) {
			this.session.items.push(this.make[level.items[init].func](level.items[init].spec));
			if (level.items[init].isPlayer) {this.session.player = this.session.items[this.session.items.length-1]};
		};			
		this.session.effect = []
		for (init = 0; init < level.effects.length; init++) {
			this.session.effect.push( this.makeEffect[level.effects[init].func](level.effects[init].spec) );
		};
		
		if (level.environment){
			Object.assign(game.session.environment,level.environment);
		}
		
		
		if (level.addWidgets) {
			for (init = 0; init < level.addWidgets.length; init++) {
				if (game.widgets.indexOf(level.addWidgets[init]) === -1) {
					game.widgets.push(level.addWidgets[init]);
				}
			}
		};
		
		if (level.removeWidgets) {
			for (init = 0; init < level.removeWidgets.length; init++) {
				if (game.widgets.indexOf(level.removeWidgets[init]) > -1) {
					
					game.widgets.splice (game.widgets.indexOf(level.removeWidgets[init]), 1 );
					
				}
			}
		};
		
		game.keyMap ={};
		game.cycleCount = 0;
		game.session.gameStatus = options.cyclesForLevelScreen? 'levelScreen' : 'play';
	};
	
	game.refresh = function() {
		var timeStamp = new Date(),buttonsPressed = [];
		
		switch(this.session.gameStatus) {
			case 'play' :			
				if (this.session.player.dead === false) {
					if (game.enableTouch) {
						if (game.swipeDelay.x){game.swipeDelay.x--}
						if (game.swipeDelay.y){game.swipeDelay.y--}
						var touch;
						for (var i=0; i<this.ongoingTouches.length; i++) {
							touch = this.ongoingTouches[i];
							if (touch.status.button) {
								buttonsPressed.push(touch.status.button.name);
								if (touch.status.button.type === "click") {touch.status.button = null;}
							};
						};
					}
					
					this.reactToControls(buttonsPressed);
				}
				this.runItemActions();		
				if (game.cycleCount % game.numberOfCyclesBetweenCheckingLevelEnds === 0 ) {		
					if (typeof this.level[this.session.currentLevel].victoryCondition === 'function') {
						if (this.level[this.session.currentLevel].victoryCondition() === true && !game.session.waitingToReset) {
							this.handlePlayerWinsLevel()
						};
					};
					if (typeof this.level[this.session.currentLevel].failureCondition === 'function') {
						if (this.level[this.session.currentLevel].failureCondition() === true && !game.session.waitingToReset) {
							this.handlePlayerLosesLevel()
						};
					}	
					if (game.session.player.dead == true && game.session.waitingToReset === false) {
						this.handlePlayerLosesLevel();
					};			
				};			
				break;
			
			case 'highscoreEntry' :
				this.reactToHighscoreEntry();
				break;
			
			case 'levelScreen' :
				if (this.cycleCount > options.cyclesForLevelScreen || this.keyMap[" "]) {
					this.session.gameStatus = 'play';
				}			
				break;
			
			case 'titleScreen' :			
				if (this.keyMap[" "] || game.ongoingTouches.length ) {
					game.setUpLevel(0);	
				}
				break
		};
				
		if (game.cycleCount === game.session.resetTime) {	
			switch (game.session.waitingToReset) {
				case 'restartLevel' :
					game.setUpLevel(game.session.currentLevel);	break;
				case 'gameOver' :
					game.session.gameStatus = 'highscoreEntry';	break;
				case 'gameWon' :
					game.session.gameStatus = 'highscoreEntry';	break;
				case 'nextLevel' :
					this.setUpLevel(this.session.currentLevel+1);break;
			};			
			game.session.waitingToReset = false;
			game.session.resetTime = false;	
		};
		
		game.cycleCount++;	
		this.renderScreen();
		
		timeStamp = new Date() - timeStamp; 
		//	if (timeStamp > 24) console.log('long cycle:' + timeStamp)
		if (game.session.paused === false) {
			game.timer = setTimeout(function(){game.refresh()},(options.msPerGameCycle-timeStamp > 0 ? options.msPerGameCycle-timeStamp : 1) );
		}
	};
		
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
			
			var newScore  = {
				name: game.session.highscoreName,
				score: game.session.score,
				date: new Date()
			}
			this.localScores.push(newScore);
			if (typeof game.spoof.sendScore === 'function') {game.handleSendingScore(newScore)};
			game.lastScore = newScore;
			game.session.reset();
		}
	};
	
	game.handleFetchingScore = function () {
		game.fetchScoreIsPending = true;
		game.spoof.fetchScore()
		.then( function(results) {
			game.fetchScoreIsPending = false;
			if (results.success) {
				game.remoteScores = results.data;
			} else {
				handleFail();
			}
		})
		.catch (function(error){
			game.fetchScoreIsPending = false;
			handleFail();
		});
		
		function handleFail() {
			console.error('failed to fetch current scores');
			if (game.remoteScores.length === 0 && game.fallbackScores.length >0 ) {
				game.remoteScores = [].concat(game.fallbackScores);
			}
		}
	};
	
	game.handleSendingScore = function (newScore){
		game.fetchScoreIsPending = true;
		this.spoof.sendScore(newScore)
		.then( function(response) {
			game.fetchScoreIsPending = false;
			if (response.success) {
				game.remoteScores = response.data;
				var i = game.localScores.indexOf(newScore);
				if (i > -1) {
					game.localScores.splice(i,1)
				}
			} else {
				game.fetchScoreIsPending = false;
				console.log ('failed to update:', response)
			}
		})
		.catch (function(error) {
			console.log('error with highscore update');
		});		
	}
	
	game.renderTitleScreen = function (c,ctx,plotOffset) {
		var fontUnit = c.clientHeight/100;
		
		ctx.strokeStyle = "white";
		ctx.strokeRect(40, 80, c.width-80, c.height-160);
		
		ctx.beginPath();
		ctx.font = (fontUnit*12) + "px sans-serif";
		ctx.fillStyle = "red";
		ctx.textAlign = "center";
		ctx.textBaseline="top";
		ctx.fillText('Default Title Screen' , c.width/2, c.height*2/10);
		ctx.font = (fontUnit*8) + "px sans-serif";
		if (game.enableTouch) {
			ctx.fillText('Press space or touch to start' , c.width/2, c.height*3/10);
		} else {
			ctx.fillText('Press space to start' , c.width/2, c.height*3/10);
		}

	};
	
	game.renderHighscores = function (c,ctx,plotOffset) {		
		var numberOfHighScoresToDisplay = 5;
		var fontUnit = c.clientHeight/100;
		var scoreTable = game.localScores.concat(game.remoteScores).sort(function(a,b){
			if (b.score === a.score) {return b.date - a.date};
			return b.score - a.score;
		});
		
		var fontUnit = c.clientHeight/100;
		
		ctx.strokeStyle = "white";
		ctx.strokeRect(40, 80, c.width-80, c.height-160);
		
		ctx.beginPath();
		ctx.font = (fontUnit*8) + "px monospace";
		ctx.textBaseline = "top";
		
		ctx.fillStyle = 'white';
		ctx.textAlign = "center";
		ctx.fillText ('HIGHSCORES',c.width-(c.width*1/2), (c.height/20)*(3));
		
		if (game.fetchScoreIsPending) {
			if (game.cycleCount % 20 > 5) {
				ctx.textAlign = "right";
				ctx.fillText ('(waiting for updates from server)',(c.width*9/10), (c.height * 8/10));
			}

		}
		
		for (var i = 0; (i < numberOfHighScoresToDisplay && i < scoreTable.length); i++) {	
			ctx.fillStyle = (scoreTable[i] === game.lastScore) ? 'red' : 'white';
			ctx.textAlign = "left";
			ctx.fillText ( (i+1)+ ' ' +scoreTable[i].name, c.width*1/4, (c.height/20)*(i+4) );
			ctx.textAlign = "right";
			ctx.fillText (scoreTable[i].score,
				c.width-(c.width*1/4), (c.height/20)*(i+4)
			);
		}
		if (game.lastScore) {
			var placeInTable = scoreTable.indexOf(game.lastScore);
			if ( placeInTable >= numberOfHighScoresToDisplay  ) {
				ctx.fillStyle = 'red';
				ctx.textAlign = "left";
				ctx.fillText ( (placeInTable+1)+ ' ' +game.lastScore.name, c.width*1/4, (c.height/20)*(numberOfHighScoresToDisplay+7.5) );
				ctx.textAlign = "right";
				ctx.fillText (game.lastScore.score,c.width-(c.width*1/4), (c.height/20)*(numberOfHighScoresToDisplay+7.5));
			}
		}
	}
	
	game.renderLevelScreen = function (c,ctx,plotOffset) {
		ctx.beginPath();
		ctx.font = (c.height * 8/100)+"px sans-serif";;
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline="top";
		ctx.fillText('level ' + this.session.currentLevel + ' - ' + (options.cyclesForLevelScreen-this.cycleCount+1) , c.width/2, c.height/4);
	};
	
	game.renderGameOverMessage = function(c,ctx,plotOffset) {
		ctx.beginPath();
		ctx.font = (c.height * 5/100)+"px sans-serif";;
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline="top";

		ctx.fillText('GAME OVER!' , c.width/2, c.height/2);

	};
	
	game.renderGameWonMessage = function(c,ctx,plotOffset) {
		ctx.beginPath();
		ctx.font = (c.height * 5/100)+"px sans-serif";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline="top";

		ctx.fillText('YOU WIN THE GAME!' , c.width/2, c.height/2);

	};
		
	game.renderScreen = function() {
		var c = this.canvasElement;	var ctx = c.getContext("2d");
		var plotOffset = {x:0,y:0}, highscoreNameText='', i;
				
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,c.width,c.height);
		ctx.lineWidth = 1;
		
		if (game.session.player.render){
			plotOffset.x = 
				Math.min(
					game.level[game.session.currentLevel].width-1000,
					Math.max(this.session.player.x-options.leftOffset,0)
				) || 0;
			plotOffset.y = 
				Math.min(
					game.level[game.session.currentLevel].height-1000,
					Math.max(this.session.player.renderY-500,0)
				) || 0 ;				
		};
		
		
		if (this.session.gameStatus === 'play' || this.session.gameStatus === 'cutScene') {
			this.renderBackground(c,ctx,plotOffset);
			for (i=0;i<this.session.items.length;i++) {
				if (this.session.items[i].dead == false) {
					this.session.items[i].render(ctx,plotOffset)
				}
			}			
			for (i=0;i<this.session.effect.length;i++) {
				this.session.effect[i].render(ctx,plotOffset,c);
				this.session.effect[i].animateFrame++;			
			}
			function checkEffectNotFinished(effect) {return (effect.animateFrame <= effect.lastFrame || effect.lastFrame === -1)}
			this.session.effect = this.session.effect.filter(checkEffectNotFinished);
			
			for (i = 0; i<game.widgets.length; i++) {
				if (typeof game.widgets[i] === 'function') {game.widgets[i](c,ctx,plotOffset)}
				if (typeof game.widgets[i] === 'object') {game.widgets[i].render(c,ctx,plotOffset)}
			};
			
			if (game.enableTouch) {
				for (i=0; i<game.touchButtons.length;i++) {
					ctx.beginPath();
					ctx.strokeStyle = "white";
					ctx.arc(game.touchButtons[i].x,game.touchButtons[i].y,game.touchButtons[i].r,0,Math.PI*2);
					ctx.stroke();
				}
				ctx.beginPath();
				ctx.strokeStyle = "white";
				ctx.rect  (20,930,50,50);
				ctx.moveTo(45,955);
				ctx.lineTo(45+(game.swipeDirection.x * 30),955+ (game.swipeDirection.y *30));
				ctx.moveTo(45+(game.swipeDirection.x * 30)+10,955+ (game.swipeDirection.y *30));
				ctx.arc   (45+(game.swipeDirection.x * 30),955+ (game.swipeDirection.y *30),10,0,Math.PI*2);
				ctx.stroke()
				
				ctx.beginPath();
				ctx.strokeStyle = "white";
				ctx.rect  (920,30,50,50);
				ctx.moveTo(945,55);
				ctx.lineTo(945+(game.swipeDirection.x * 30),55+ (game.swipeDirection.y *30));
				ctx.moveTo(945+(game.swipeDirection.x * 30)+10,55+ (game.swipeDirection.y *30));
				ctx.arc   (945+(game.swipeDirection.x * 30),55+ (game.swipeDirection.y *30),10,0,Math.PI*2);
				ctx.stroke()
				
			}
			
			if (this.session.waitingToReset == 'gameOver') {this.renderGameOverMessage(c,ctx,plotOffset)}
			if (this.session.waitingToReset == 'gameWon') {this.renderGameWonMessage(c,ctx,plotOffset)}
		}
		
		if (this.session.gameStatus === 'highscoreEntry') {
			ctx.beginPath();
			ctx.font = (c.height * 2.5/100)+"px sans-serif";;
			ctx.fillStyle = "red";
			ctx.textAlign = "center";
			ctx.textBaseline="top";

			ctx.fillText('ENTER NAME', c.width/2, c.height*(0.25));

			ctx.font = (c.height * 12/100)+"px sans-serif";;
			ctx.fillStyle = "red";
			ctx.textAlign = "center";
			ctx.textBaseline="top";			
			ctx.fillText(this.session.highscoreName, c.width/2, c.height*(0.50));
		}

		if (this.session.gameStatus === 'levelScreen') {
			this.renderLevelScreen(c,ctx,plotOffset);
		};
		
		if (this.session.gameStatus === 'titleScreen') {
			if (this.cycleCount%200 < 100) {
				this.renderTitleScreen(c,ctx,plotOffset);				
			} else {
				this.renderHighscores(c,ctx,plotOffset)
			}
		};
		
	};

	game.renderBackground = function(c,ctx,plotOffset){},
	
	game.customNewLevelAction = function(){},
	
	game.reactToControls = function(){},
			
	game.handlePlayerWinsLevel = function () {	
		if (this.level[this.session.currentLevel].score) {this.session.score += this.level[this.session.currentLevel].score}
		if (this.session.currentLevel+1 < this.level.length) {
			game.session.waitingToReset = 'nextLevel';
			game.session.resetTime = game.cycleCount + options.cyclesBetweenLevelEndAndReset;
		} else {
			game.session.waitingToReset = 'gameWon';
			game.session.resetTime = game.cycleCount + options.cyclesBetweenLevelEndAndReset;
		};
	};
		
	game.handlePlayerLosesLevel = function () {
		if (game.session.lives-- > 0) {
			game.session.waitingToReset = 'restartLevel';
			game.session.resetTime = game.cycleCount + options.cyclesBetweenDeathAndReset;
		} else {
			game.session.waitingToReset = 'gameOver';
			game.session.resetTime = game.cycleCount + options.cyclesBetweenDeathAndReset;
		};	
		return true;
	};
	
	game.runItemActions = function() {
		var items = this.session.items;
		for (var m=0;m<items.length;m++) {
			for (var a=0;a<items[m].automaticActions.length;a++) {
				if (typeof(items[m].automaticActions[a]) === 'function') {
					items[m].automaticActions[a].apply(items[m],[]);
				}
			};
			if (items[m].dead === false && typeof(items[m].move) === 'function') {
				items[m].move();
				if (options.runCollisionTestInMainLoop) {
					for (var t = 0; t<items.length; t++) {
						if (t !== m) {
							if (this.calc.areIntersecting(items[m],items[t])) {	
								if (typeof(items[m].hit[items[t].type]) === 'function') {items[m].hit[items[t].type].apply(items[m],[items[t]])}
								if (typeof(items[t].hit[items[m].type]) === 'function') {items[t].hit[items[m].type].apply(items[t],[items[m],true])}
							};
						};
					};
				};
			};
		};	
		this.session.items = items.filter(function(item){return item.dead==false});	
	};

	
	game.make.item = function(spec) {
		var that = {}
		that.x = spec.x || 0 ;
		that.y = spec.y || 0;
		that.width = spec.width || 10;
		that.height = spec.height || 10;
		that.color = spec.color || 'gray';		
		that.pattern = spec.pattern ? 
			game.sprite[spec.pattern]: 
			false;
		that.dead = false;
		that.type= 'none';
		that.circular = false;
		
		Object.defineProperties(that, {
			renderY:{
				get:function(){
					return options.bottomOfScreenIsZeroY ?
						game.level[game.session.currentLevel].height - this.y - this.height :
						this.y;
				}
			},
			top:{
				get: function(){
					return options.bottomOfScreenIsZeroY ?
						this.y + this.height : this.y;
				},
				set: function(value) {
					this.y = options.bottomOfScreenIsZeroY ?
						value - this.height : value;
					return value;
				}	
			},
			bottom:{
				get: function(){
					return options.bottomOfScreenIsZeroY ?
						this.y : this.y+ this.height;
				},
				set: function(value) {
					this.y = options.bottomOfScreenIsZeroY ?
						value : value - this.height ;
					return value;
				}	
			},
			left:{
				get: function() {return this.x},
				set: function(value) {this.x = value; return value}
			},
			right:{
				get: function() {return this.x + this.width},
				set: function(value) {this.x = value - this.width; return value}				
			}
		})
		
		
		that.hit={};
		that.automaticActions = [];
		
		var render = function (ctx,plotOffset){
			ctx.beginPath();
			ctx.fillStyle = this.pattern ?  
				ctx.createPattern(this.pattern, "repeat") :
				this.color;
			ctx.rect(this.x - plotOffset.x,this.renderY - plotOffset.y,this.width,this.height);
			ctx.fill();	
		}
		that.render = render;
		
	
		return that;
	};
	
	game.make.roundItem = function(spec) {
		var that = {};
		that.x = spec.x || 0 ;
		that.y = spec.y || 0;
		that.radius = spec.radius || 10;
		that.color = spec.color || 'gray';		
		that.pattern = spec.pattern ? 
			game.sprite[spec.pattern]: 
			false;
		that.dead = false;
		that.type= 'none';
		that.circular = true;

		that.hit={};
		that.automaticActions = [];
		
		Object.defineProperties(that, {
			renderY:{
				get:function(){
					return options.bottomOfScreenIsZeroY ?
						game.level[game.session.currentLevel].height - this.y:
						this.y;
				}
			},
			top:{
				get: function(){
					return options.bottomOfScreenIsZeroY ?
						this.y + this.radius : this.y - this.radius;
				},
				set: function(value) {
					this.y = options.bottomOfScreenIsZeroY ?
						this.y - this.radius : this.y + this.radius;
					return value;
				}	
			},
			bottom:{
				get: function(){
					return options.bottomOfScreenIsZeroY ?
						this.y - this.radius : this.y + this.radius;
				},
				set: function(value) {
					this.y = options.bottomOfScreenIsZeroY ?
						value + this.radius : value - this.radius;
					return value;
				}	
			},
			left:{
				get: function() {return this.x - this.radius},
				set: function(value) {this.x = value + this.radius; return value}
			},
			right:{
				get: function() {return this.x + this.radius},
				set: function(value) {this.x = value - this.radius; return value}				
			}
		})
		
		var render = function (ctx,plotOffset){
			ctx.beginPath();
			ctx.fillStyle = this.pattern ?  
				ctx.createPattern(this.pattern, "repeat") :
				this.color;
			ctx.arc(this.x-plotOffset.x, this.renderY-plotOffset.y, this.radius, 0,2*Math.PI);
			ctx.fill();	
		}
		that.render = render;
		
		
		return that;
	};
	
	game.makeEffect.effect = function(spec) {
		var that = {};
		that.animateFrame = 0;
		that.lastFrame = spec.lastFrame || -1;
		that.height = spec.height || 0;
		that.width = spec.width || 0;
		that.x = spec.x || 0;
		that.y = spec.y || 0;
		
		Object.defineProperties(that, {
			renderY:{
				get:function(){
					return options.bottomOfScreenIsZeroY ?
						game.level[game.session.currentLevel].height - this.y - this.height :
						this.y;
				}
			}
		})
		
		
		var render = function (ctx,plotOffset){
		}
		that.render = render;
		
		return that;
	};
	
	game.makeEffect.message = function(spec) {
		var that = game.makeEffect.effect(spec);
		that.message = spec.message || "no message defined!";
		that.color = spec.color || "black";
		that.font = spec.font || "arial";
		that.size = spec.size || (game.canvasElement.height * 6/100) +"px";
		
		var render = function (ctx,plotOffset,c){
			ctx.beginPath();
			ctx.font = this.size + " " + this.font;
			ctx.fillStyle = this.color;
			ctx.textAlign = "center";
			ctx.fillText(this.message, c.width/2, c.height/2);		
		};
		that.render = render;
		
		return that;
	};
	
	game.makeEffect.expandingRing = function(spec) {
		var that = game.makeEffect.effect(spec);		
		var render = function (ctx,plotOffset,c){
			ctx.beginPath();
			ctx.arc(this.x- plotOffset.x,this.renderY- plotOffset.y,1+this.animateFrame,0,2*Math.PI);
			var rgbString = 'rgb(' + (250-(this.animateFrame*4.5)) + ',' + (250-(this.animateFrame*4.5)) + ',' + (250-(this.animateFrame*4.5)) + ')';
			ctx.strokeStyle = rgbString;
			ctx.lineWidth = 2;
			ctx.stroke();
		};
		that.render = render;
		
		return that;
	}
	
	game.calc.areIntersecting = function (item1, item2) {
		if (item1.circular && item2.circular) {
			return Math.sqrt(  (item1.x-item2.x)*(item1.x-item2.x) +  (item1.y-item2.y)*(item1.y-item2.y)) < (item1.radius + item2.radius );
		};
		
		if (item1.circular && !item2.circular) {return rectangleAndCircleTest(item2,item1)};
		if (!item1.circular && item2.circular) {return rectangleAndCircleTest(item1,item2)};
		
		return !(item2.x > item1.x+item1.width || 
				 item2.x+item2.width < item1.x || 
				 item2.y+item2.height <= item1.y ||
				 item2.y >= item1.y+item1.height);
				 
		function rectangleAndCircleTest (rect, circle) {
			var circleDistanceX = Math.abs(circle.x - (rect.x + rect.width/2)  );
			var circleDistanceY = Math.abs(circle.y - (rect.y + rect.height/2) ) ;
			if (circleDistanceX > (rect.width/2 + circle.radius)) { return false; }
			if (circleDistanceY > (rect.height/2 + circle.radius)) { return false; }
			if (circleDistanceX <= (rect.width/2)) { return true; } 
			if (circleDistanceY <= (rect.height/2)) { return true; }
			var cornerDistance_sq = (circleDistanceX - rect.width/2)*(circleDistanceX - rect.width/2) +
                         (circleDistanceY - rect.height/2)*(circleDistanceY - rect.height/2);
			return (cornerDistance_sq <= (circle.radius*circle.radius));
		};
		
	}; 
	
	game.calc.distance = function(p1,p2) {
		p2 = p2 || {x:0,y:0};
		return Math.sqrt(  (p1.x-p2.x)*(p1.x-p2.x) +  (p1.y-p2.y)*(p1.y-p2.y))
	};
	
	game.calc.round = function(number, dp){
		var value = number;
		var pow = Math.pow(10,dp);
		value = value * pow;
		value = Math.round(value) / pow;
		return value;
	};
	
	
	for (var loadingDisk = 0; loadingDisk < disks.length; loadingDisk++) {
		game = disks[loadingDisk](game,options);
	};
	
	
	return game;
}
