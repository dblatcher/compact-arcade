// dependency : spriteHandling

function spaceShooter(game) {
console.log('running spaceShooter')
	game.soundFiles.push ('jump.mp3','land.mp3','bounce.mp3');	
	game.spriteFiles.push ('bat.png');	

	game.level = [

		{width:3000, height:1000,
			items :[
				{func:"alien", spec:{x:2000,y:400,color:"yellow",behaviour:"loop"}},
				{func:"alien", spec:{x:2600,y:600,color:"yellow",behaviour:"loop"}},							
				{func:"alien", spec:{x:1100,y:600,color:"blue"}},
				{func:"ship", spec:{x:200,y:500}, isPlayer:true}
			],
			effects : [
	
			],
			victoryCondition : function() {
				return game.session.player.x>2750;
			}
		},
		
		{width:3000, height:1000,
			items :[
				{func:"alien", spec:{x:2000,y:400,color:"yellow",behaviour:"loop"}},
				{func:"alien", spec:{x:2600,y:600,color:"yellow",behaviour:"loop"}},				
				{func:"alien", spec:{x:2100,y:320,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2200,y:340,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2300,y:360,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2200,y:800,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2300,y:820,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2400,y:840,color:"blue",behaviour:"upAndDown"}},
				{func:"alien", spec:{x:2500,y:860,color:"blue",behaviour:"upAndDown"}},				
				{func:"alien", spec:{x:1100,y:600,color:"blue"}},
				{func:"ship", spec:{x:200,y:500}, isPlayer:true}
			],
			effects : [
	
			],
			victoryCondition : function() {
				return game.session.player.x>2750;
			}
		}
	
	];

	
	game.library.spaceShooter = {
		defineStars : function(level) {
			var currentLevel = game.level[level];
			var number =  200;
			var depth = 3;
			var colorRange =  ['white', 'white', 'red'];
			var star = [];
			
			for (var i = 0; i< number; i++) {
				star[i] = {
					x : Math.floor(Math.random() * currentLevel.width),
					y : Math.floor(Math.random() * currentLevel.height),
					color : colorRange[Math.floor(Math.random() * colorRange.length)],
					parallax : 1 + Math.floor(Math.random() * depth)
				};
			}
			game.session.starfield = star;
		},	
		plotStars : function(c,ctx,plotOffset){
			var star;
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,c.width,c.height);
			for (var p = 0; p < game.session.starfield.length; p++) {
				star  = game.session.starfield[p]	
				ctx.beginPath();
				ctx.fillStyle = star.color;
				ctx.fillRect(star.x-(plotOffset.x/star.parallax),star.y-(plotOffset.y/star.parallax),2,2);
			};
		}
	};
	
	game.customNewLevelAction = function(level) {
		game.library.spaceShooter.defineStars(level);
	};

	game.renderBackground = function(c,ctx,plotOffset) {
		game.library.spaceShooter.plotStars(c,ctx,plotOffset);
	}; 
	
	game.renderLevelScreen = function(c,ctx,plotOffset) {
		game.library.spaceShooter.plotStars(c,ctx,plotOffset);	
		if (this.cycleCount%12 >= 4) {
			ctx.beginPath();
			ctx.font = "6vh serif";
			ctx.fillStyle = "yellow";
			ctx.textAlign = "left";
			ctx.textBaseline="top";
			ctx.fillText('level ' + (this.session.currentLevel+1), c.width/4, c.height/4);
		}
	}

	game.reactToControls = function() {
		var player = this.session.player;

		if (player.action === "die") {return false};
		
		if (this.keyMap["ArrowLeft"]) {player.forwardSpeed = -2};
		if (this.keyMap["ArrowRight"]) {player.forwardSpeed = 2};	
		if (this.keyMap["ArrowUp"]) {player.upSpeed = 4};
		if (this.keyMap["ArrowDown"]) {player.upSpeed = -4};

		if (!this.keyMap["ArrowLeft"] && !this.keyMap["ArrowRight"])
			{player.forwardSpeed = 0};
		if (!this.keyMap["ArrowDown"] && !this.keyMap["ArrowUp"])
			{player.upSpeed = 0}
		
		if (this.keyMap[" "]) {
			this.keyMap[" "] = false;
			this.session.items.push(
				this.make.bullet({x:player.x+60, y:player.y + player.height/2})
			);
		};
		
	};

	game.spriteData = {
		bat :{
			frameHeight:10, frameWidth:10,
			frameMap : [
				{source:'bat.png',x:0,y:0},
				{source:'bat.png',x:10,y:0},
				{source:'bat.png',x:0,y:10},
				{source:'bat.png',x:10,y:10},
				{source:'bat.png',x:20,y:0},
				{source:'bat.png',x:20,y:10},
			],
			animateCycle : {
				stand:{right:[2,3],left:[0,1]},
				walk:{right:[2,3],left:[0,1]},
				jump:{right:[2,3],left:[0,1]},
				die:{right:[4,5,4,5],left:[4,5,4,5],end:function() {this.dead = true;}},
			}
		}
	};


	game.make.ship = function(spec) {
		var that = game.make.item(spec);
		that.isGod = spec.isGod || false;
		that.spriteData = game.spriteData['bat'];
		that.frame = 0;
		that.direction = spec.direction || 'right';
		that.action = spec.action || 'stand';
		that.forwardSpeed = spec.forwardSpeed || 0;
		that.upSpeed = spec.upSpeed || 0;
		that.width=50;that.height=50;
		that.type = "player";

		that.automaticActions.push(game.library.spriteHandling.updateSpriteFrame);
		
		
		var setAction = function(newAction,newDirection) {
			if (this.action === 'die') {return false;}; // if the character is dying, don't stop dying
			game.library.spriteHandling.setAction.apply(this,[newAction,newDirection]);
		}
		that.setAction = setAction;
		
		var render = function(ctx,plotOffset) {
			game.library.spriteHandling.renderSprite(this,ctx,plotOffset);
		};
		that.render = render;
		
		var move = function() {
			if (this.action === 'die') {return};
			this.x += 3;
			this.x += this.forwardSpeed;
			this.y += this.upSpeed;
		};
		that.move = move;
		
		that.hit.enemy = function (enemy){
			if (!this.isGod) {
				this.forwardSpeed = 0;
				this.upSpeed = 0;
				this.setAction('die');
			};
		};
		
		return that;
	};

	game.make.bullet = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = "missle";
		that.forwardSpeed = spec.forwardSpeed || 10;
		that.upSpeed = spec.upSpeed || 0;
		that.radius = 4;
		that.color = spec.color || "red";
		
		var move = function() {
			this.x += this.forwardSpeed;
			this.y += this.upSpeed;
		};
		that.move = move;
		
		that.hit.enemy = function(enemy) {
			this.dead = true;
		};
		
		return that;
	}
	
	
	game.make.alien = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = "enemy";
		that.forwardSpeed = spec.forwardSpeed || -2;
		that.upSpeed = spec.upSpeed || 0;
		that.width = spec.width || 50;
		that.height = spec.height || 50;
		that.radius = spec.radius || 15;
		that.brain = {};
		that.behaviour = spec.behaviour ?
			game.enemyBehaviour[spec.behaviour] :
			function(){};
		that.score = spec.score || 10;
		
		var move = function() {
			this.behaviour();
			this.x += this.forwardSpeed;
			this.y += this.upSpeed;
		};
		that.move = move;
		
		that.hit.missle = function(missle) {
			this.dead = true;
			game.session.score += this.score;
			game.session.effect.push(
				game.makeEffect.expandingRing({x:missle.x, y:missle.y, lastFrame:20})
			);
		};
		
		return that;
	}
	
	game.enemyBehaviour = {};
	game.enemyBehaviour.upAndDown = function() {
		var space = game.level[game.session.currentLevel].height;
		if (!this.brain.direction) {
			this.brain.direction = (this.y > space*0.5) ? -4 : 4;
		};
		if (this.y > space*0.9) {this.brain.direction = -4};
		if (this.y < space*0.1) {this.brain.direction = 4};
		
		this.upSpeed = this.brain.direction;
	};
	game.enemyBehaviour.loop = function() {
		if(typeof(this.brain.count) === 'undefined'){
			this.brain.direction = {x:0,y:0};
			this.brain.count = 0;
		};
		
		var radians = (this.brain.count*(Math.PI *2 / 100 ));
		
		this.brain.direction.x = -1 + (Math.sin(radians)) * 4 ;
		this.brain.direction.y = (Math.cos(radians)) * 6;
		
		this.brain.count++;
		if (this.brain.count > 100) {this.brain.count = 0};
		
		this.forwardSpeed = this.brain.direction.x;
		this.upSpeed = this.brain.direction.y;
	};
	
	
return game;
}