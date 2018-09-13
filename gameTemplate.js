function createGameTemplate (disks) {
	var game = {
		timer:0, cycleCount:0, numberOfCyclesBetweenCheckingLevelEnds:10, 
		keyMap:{}, startingLives:1,
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
			path : "./sounds/",
			play: function(choosenSound) {
				this[choosenSound].play();
			},
			stop: function(choosenSound) {
				this[choosenSound].pause();
			}
		},
		
		sprite : {
			path : "./sprites/",
		},
		
		make : {},
		makeEffect : {},
		calc : {},
		session: {},
		
		customNewLevelAction : function(){},
		renderBackground : function(){},
		initialise : function(){},
		setUpLevel : function(){},
		refresh : function(){},
		runItemActions : function(){},
		reactToHighscoreEntry : function(){},
		renderScreen : function(){},
		handleEndOfLevel : function(){},
		handleDeadPlayer : function(){},
		
		library : {}
	};
	
	game.session = {
			paused: false,
			items : [],
			effect:[],
			player:{},
			currentLevel : 0,
			score:0,
			lives:2,
			waitingToReset:false,
			gameStatus:'none',
			highscoreName:'',
			reset:function() {
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
		
		window.onblur = function() {
			game.keyMap={};
			game.session.paused = true;
			
		};
		window.onfocus = function() {
			game.session.paused = false;
			game.timer = setTimeout(function(){game.refresh()},25);
		};

		for(var loop=0; loop < this.soundFiles.length; loop++) {
			addSound(this.soundFiles[loop]);
		};
		for(var loop=0; loop < this.spriteFiles.length; loop++) {
			addSprite(this.spriteFiles[loop]);
		};
					
		this.session.reset();			
		this.timer = setTimeout(function(){game.refresh()},25);
		
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
		
	game.setUpLevel = function(level) {
		var init;
		if (level !== game.session.currentLevel || level === 0 ) {
			this.customNewLevelAction(level);
		}
		game.session.currentLevel = level;
		this.session.items = [];
		for (init = 0; init < this.level[level].items.length; init++) {
			this.session.items.push(this.make[this.level[level].items[init].func](this.level[level].items[init].spec));
			if (this.level[level].items[init].isPlayer) {this.session.player = this.session.items[this.session.items.length-1]};
		};			
		this.session.effect = []
		for (init = 0; init < this.level[level].effects.length; init++) {
			this.session.effect.push( this.makeEffect[this.level[level].effects[init].func](this.level[level].effects[init].spec) );
		};
		game.keyMap ={};
		game.cycleCount = 0;
	};
	
	game.refresh = function() {
		var timeStamp = new Date();
		
		if (this.session.gameStatus === 'play') {
			if (this.session.player.dead === false) {this.reactToControls()};
			this.runItemActions();		
			if (game.cycleCount % game.numberOfCyclesBetweenCheckingLevelEnds === 0 || game.session.currentLevel === 0 ) {		
				if (this.level[this.session.currentLevel].victoryCondition() === true) {
					this.handleEndOfLevel()
				};
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

		if (game.session.paused === false) {
			game.timer = setTimeout(function(){game.refresh()},(25-timeStamp > 0 ? 25-timeStamp : 1) );
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
			this.sendScore(game.session.highscoreName, game.session.score);
			game.session.reset();
		}
	};
		
	game.renderScreen = function() {
			var c = this.canvasElement;	var ctx = c.getContext("2d");
			var plotOffset = {x:0,y:0}, statusLineText='', highscoreNameText='';
			
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
			
			if (game.session.player.plotY){
				plotOffset.x = Math.min(game.level[game.session.currentLevel].width-1000,Math.max(this.session.player.x-500,0)) || 0;
				plotOffset.y = Math.min(game.level[game.session.currentLevel].height-1000,Math.max(this.session.player.plotY()-500,0)) || 0;			
			};
			
			this.renderBackground(plotOffset);
			
			if (this.session.gameStatus === 'play') {
				for (p=0;p<this.session.items.length;p++) {
					if (this.session.items[p].dead == false) {
						this.session.items[p].render(ctx,plotOffset)
					}
				}			

				for (p=0;p<this.session.effect.length;p++) {
					this.session.effect[p].render(ctx,plotOffset,c);
					this.session.effect[p].animateFrame++;			
				}
				function checkEffectNotFinished(effect) {return (effect.animateFrame <= effect.lastFrame || effect.lastFrame === -1)}
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
			
	game.handleEndOfLevel = function () {	
		if (this.level[this.session.currentLevel].score) {this.session.score += this.level[this.session.currentLevel].score}
		if (this.session.currentLevel+1 < this.level.length) { this.setUpLevel(this.session.currentLevel+1)}
		else {
			game.session.effect.push (game.makeEffect.message({message:'You win!', lastFrame:3000/25}));
			game.session.waitingToReset = true;
			game.session.player={};
			setTimeout(function() {
				game.session.waitingToReset = false;
				game.session.gameStatus = 'highscoreEntry';
			},3000);
		};
	};
		
	game.handleDeadPlayer = function () {
			if (game.session.lives-- > 0) {
				game.session.waitingToReset = true;
				setTimeout(function() {
					game.session.waitingToReset = false;
					game.setUpLevel(game.session.currentLevel);
				},2500);
			} else {
				game.session.effect.push (game.makeEffect.message({message:'game over!', lastFrame:3000/25}));
				game.session.waitingToReset = true;
				game.session.player={};
				setTimeout(function() {
					game.session.waitingToReset = false;
					game.session.gameStatus = 'highscoreEntry';
				},3000);
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
				
				for (var t = 0; t<items.length; t++) {
					if (t !== m) {
						if (this.calc.areIntersecting(items[m],items[t])) {	
							if (typeof(items[m].hit[items[t].type]) === 'function') {items[m].hit[items[t].type].apply(items[m],[items[t]])}
							if (typeof(items[t].hit[items[m].type]) === 'function') {items[t].hit[items[m].type].apply(items[t],[items[m],true])}
						}
					}
				}
				
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
		that.dead = false;
		that.type= 'none';
		
		that.plotY = function() {
			return game.level[game.session.currentLevel].height - this.y - this.height;
		}
		that.hit={};
		that.automaticActions = [];
		
		var render = function (ctx,plotOffset){
			ctx.beginPath();
			ctx.fillStyle = this.color;
			ctx.rect(this.x- plotOffset.x,this.plotY() - plotOffset.y,this.width,this.height);
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
		that.plotY = function() {
			return game.level[game.session.currentLevel].height - this.y - this.height;
		}
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
		that.size = spec.size || "15vh";
		
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
			ctx.arc(this.x- plotOffset.x,this.plotY()- plotOffset.y,1+this.animateFrame,0,2*Math.PI);
			var rgbString = 'rgb(' + (250-(this.animateFrame*4.5)) + ',' + (250-(this.animateFrame*4.5)) + ',' + (250-(this.animateFrame*4.5)) + ')';
			ctx.strokeStyle = rgbString;
			ctx.lineWidth = 2;
			ctx.stroke();
		};
		that.render = render;
		
		return that;
	}
	
	game.calc.areIntersecting = function (bk, ds) {
		return !(ds.x > bk.x+bk.width || 
				 ds.x+ds.width < bk.x || 
				 ds.y+ds.height <= bk.y ||
				 ds.y >= bk.y+bk.height);
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
		game = disks[loadingDisk](game);
	};
	
	
	return game;
}




