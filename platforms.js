
function makeInstanceOfGame() {
	var game = createGameTemplate();

	game.soundFiles = ['jump.mp3','land.mp3','bounce.mp3'];	
	game.spriteFiles = ['man.png', 'man-r.png','tree.png','orc.png','orc-r.png','bat.png'];	

	game.level = [
		{width:2000,height:1000,
			items: [
				{func:'monster', spec:{x:400,y:170, action:'stand', direction:'left',flying:true, maxSpeed:10, sprite:'bat',behaviour:'flyAtPlayerWhenClose'}},
				{func:'monster', spec:{x:1100,y:500, action:'stand', direction:'left',flying:true, maxSpeed:10, sprite:'bat',behaviour:'flyAround'}},
				{func:'monster', spec:{x:1000,y:490, action:'stand', direction:'right',flying:true, maxSpeed:10, sprite:'bat'}},
				{func:'bigBat', spec:{x:1300,y:800, direction:'right', maxSpeed:10, behaviour:'flyInCircle'}},
				{func:'monster', spec:{x:200,y:100, action:'walk', direction:'right', behaviour:'dumb'}},
				{func:'monster', spec:{x:250,y:800, action:'walk', behaviour:'jumpUp'}},
				{func:'platform', spec:{x:100,y:220, width:150}},
				{func:'platform', spec:{x:200,y:600, width:250, color:'red'}},
				{func:'platform', spec:{x:140,y:400, width:180}},
				{func:'platform', spec:{x:700,y:500, width:150, color:'red'}},
				{func:'platform', spec:{x:500,y:150, width:350, height:150, color:'yellow',isObstacle:true,bounce:0.6}},
				{func:'platform', spec:{x:850,y:140, width:150, height:100, color:'crimson',isObstacle:true}},
				{func:'platform', spec:{x:1200,y:100, width:400, height:50, color:'green',isObstacle:true}},
				{func:'platform', spec:{x:1250,y:150, width:350, height:50, color:'green',isObstacle:true}},
				{func:'platform', spec:{x:1300,y:200, width:300, height:50, color:'green',isObstacle:true}},
				{func:'platform', spec:{x:1350,y:250, width:250, height:50, color:'green',isObstacle:true}},
				{func:'man', spec:{x:1230,y:700,isGod:true,action:'jump'}, isPlayer:true},
			],
			effects:[
				{type:'message',message:'under dev!', animateFrame:0, lastFrame:50}
			],
			victoryCondition : function() {
				return false;
			}
		}
	];



	game.renderBackground = function(plotOffset) {
		var c = this.canvasElement;
		var ctx = c.getContext("2d")	

		ctx.fillStyle = "lightskyblue";
		ctx.fillRect(0,0,c.width,c.height);

		ctx.fillStyle = "green";
		ctx.fillRect(0,c.height-100,c.width,c.height);
		
		ctx.beginPath();
		ctx.drawImage(game.sprite['tree.png'],
		800-(plotOffset.x/2),c.height-300-plotOffset.y,
		200,200);

		ctx.drawImage(game.sprite['tree.png'],
		500-(plotOffset.x/2),c.height-300-plotOffset.y,
		200,200);
		
		ctx.drawImage(game.sprite['tree.png'],
		400-(plotOffset.x/3),c.height-200-plotOffset.y,
		100,100);
	} 

	game.reactToControls = function() {
		var player = this.session.player;
		
		if (player.isOnGround()) {
			
			if (player.action !== 'punch') {
				if (this.keyMap["ArrowLeft"]) {player.setAction('walk','left');};
				if (this.keyMap["ArrowRight"]) {player.setAction('walk','right');};	
				if (this.keyMap["ArrowUp"]) {
					player.fallSpeed -= player.jumpForce; 
					player.setAction('jump',player.direction);
					game.sound.play('jump.mp3');
					};
			};
			
			if ((!this.keyMap["ArrowLeft"]) && player.action === 'walk' && player.direction === 'left') {player.setAction('stand','left');};
			if ((!this.keyMap["ArrowRight"]) && player.action === 'walk'&& player.direction === 'right') {player.setAction('stand','right');};
			
			if (this.keyMap[" "]) {
				player.setAction('punch');
				player.speed = 0;
				this.keyMap[" "] = false;
			};			
		};

	};

	game.spriteData = {
		man : { 
			frameWidth:10,
			frameHeight:16,
			frontOff:0.15,backOff:0.4, topOff:0.2,
			frameMap : [
				{source:'man.png',x:5,y:3,},
				{source:'man.png',x:25,y:2},
				{source:'man.png',x:45,y:2},
				{source:'man.png',x:65,y:3},
				{source:'man.png',x:85,y:3},
				{source:'man.png',x:105,y:3},
				{source:'man.png',x:125,y:3},
				{source:'man.png',x:145,y:3},
				{source:'man.png',x:165,y:2},
				{source:'man-r.png',x:165,y:3},
				{source:'man-r.png',x:145,y:2},
				{source:'man-r.png',x:125,y:2},
				{source:'man-r.png',x:105,y:3},
				{source:'man-r.png',x:85,y:3},
				{source:'man-r.png',x:65,y:3},
				{source:'man-r.png',x:45,y:4},
				{source:'man-r.png',x:25,y:3},
				{source:'man-r.png',x:5,y:2},
			],
			animateCycle :{
				stand:{right:[0],left:[9]},
				walk:{right:[1,2],left:[10,11]},
				punch:{right:[3,4,5,5,4],left:[12,13,14,14,13],end:function(){this.setAction('stand');}},
				jump:{right:[2],left:[11]},
				die:{right:[6,7,8],left:[15,16,17],end:function() {this.dead = true;}}
			}
		},
		orc : {
			frameWidth:10,
			frameHeight:16,
			topOff:0.15,
			frameMap : [
				{source:'orc.png',x:5,y:3},
				{source:'orc.png',x:25,y:2},
				{source:'orc.png',x:45,y:2},
				{source:'orc.png',x:65,y:3},
				{source:'orc.png',x:85,y:3},
				{source:'orc.png',x:105,y:3},
				{source:'orc.png',x:125,y:3},
				{source:'orc.png',x:145,y:3},
				{source:'orc.png',x:165,y:2},
				{source:'orc-r.png',x:165,y:3},
				{source:'orc-r.png',x:145,y:2},
				{source:'orc-r.png',x:125,y:2},
				{source:'orc-r.png',x:105,y:3},
				{source:'orc-r.png',x:85,y:3},
				{source:'orc-r.png',x:65,y:3},
				{source:'orc-r.png',x:45,y:4},
				{source:'orc-r.png',x:25,y:3},
				{source:'orc-r.png',x:5,y:2},
			],
			animateCycle :{
				stand:{right:[0],left:[9]},
				walk:{right:[1,2],left:[10,11]},
				jump:{right:[2],left:[11]},
				punch:{right:[3,4,5,5,4],left:[12,13,14,14,13],end:function(){this.setAction('stand');}},
				die:{right:[6,7,8],left:[15,16,17],end:function() {this.dead = true;}}
			}
		},
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

	game.behaviourData = {
		dumb: function (trigger) {
			switch (trigger.type) {
				case 'hitWall':
					this.setAction('walk','reverse');
					break;
				case 'hitMonster':
					
			};
		},
		jumpUp : function(trigger) {
			switch (trigger.type) {
				case 'noTrigger':
					if (game.cycleCount % 30 === 0 && this.isOnGround() ){
						this.fallSpeed -= this.jumpForce; 
						this.setAction('jump');
					};
			};
		},
		flyAtPlayerWhenClose : function(trigger) {
			switch (trigger.type) {
				case 'noTrigger':
					if (this.y >= game.session.player.y &&  this.y <= game.session.player.y + game.session.player.height ) {
						if (game.calc.distance(this,game.session.player)<500) {
							if ((this.direction === 'left' && this.x > game.session.player.x) || (this.direction === 'right' && this.x < game.session.player.x) ) {
								this.setAction('walk');
							}
						}
					} 			
			};
		},
		flyAround : function(trigger) {
			switch (trigger.type) {
				case 'hitMonster':
					this.fallSpeed++;
					break;
				case 'noTrigger':
					if (!this.startX) {this.startX = this.x; this.setAction('walk');}
					if (this.startX - this.x > 300 ) {this.setAction('walk','right')};
					if (this.startX - this.x < -300 ) {this.setAction('walk','left')};
					this.fallSpeed = 0;
			};
		},
		flyInCircle : function(trigger) {
			switch (trigger.type) {
				case 'noTrigger':
					if (!this.startX) {this.startX = this.x; this.setAction('walk'); this.startY = this.y}
					if (this.startX - this.x > 150 ) {this.setAction('walk','right')};
					if (this.startX - this.x < -150 ) {this.setAction('walk','left')};
					if (this.startY - this.y > 150 ) {this.fallSpeed--} else {this.fallSpeed++};
			};
		},
	};


	game.make.platform = function(spec) {
		var that = game.make.item(spec);
		that.type = 'block';
		that.width = spec.width || 50;
		that.height = spec.height || 5;
		that.isObstacle = spec.isObstacle || false;
		that.bounce = spec.bounce || 0;		
		return that;
	};

	game.make.character = function(spec) {
		var that = game.make.item(spec);
		that.isGod = spec.isGod || false;
		that.frame = 0;
		that.direction = spec.direction || 'right';
		that.action = spec.action || 'stand';
		that.fallSpeed = spec.fallSpeed || 0;
		that.speed = spec.speed || 0;
		
		that.behaviour = game.behaviourData[spec.behaviour] || 0;
		that.behaviourTrigger = [];
		
		
		
		var updateSpriteFrame	= function(){			
			if (game.cycleCount % 10 === 0 ){
				this.frame++;
				if (this.frame >= this.spriteData.animateCycle[this.action][this.direction].length) {
					if (this.spriteData.animateCycle[this.action].end) {
						this.spriteData.animateCycle[this.action].end.apply(this,[]);
					} else {this.frame=0;}
				};
			};
		};
		
		var runDefinedBehaviour = function() {
			if (typeof(this.behaviour) === 'function') {
				this.behaviour( {type:'noTrigger', data:0} );
				for (var l=0; l<this.behaviourTrigger.length; l++) {
					this.behaviour( this.behaviourTrigger[l] );
				}
			};
			this.behaviourTrigger = [];
		};

		that.automaticActions.push(updateSpriteFrame,runDefinedBehaviour);
		
		
		var setAction = function(newAction,newDirection) {
			newDirection = newDirection || this.direction;
			if (newDirection === 'reverse') {newDirection = this.direction === 'left' ? 'right' : 'left'};
			if (this.action === 'die') {return false;}; // if the character is dying, don't stop dying
			
			if (newAction === this.action && newDirection === this.direction) {return false};
			this.action = newAction;
			this.direction = newDirection;
			this.frame = 0;
			return(true);
		}
		that.setAction = setAction;
		
		var render = function(ctx,plotOffset) {
			var frame = this.spriteData.frameMap[this.spriteData.animateCycle[this.action][this.direction][this.frame]];
			
			var leftOff = (this.direction === 'left') ?
				this.spriteData.frontOff*this.width || 0:
				this.spriteData.backOff*this.width || 0;
			var rightOff = (this.direction === 'right') ?
				this.spriteData.frontOff*this.width || 0:
				this.spriteData.backOff*this.width || 0;
			var topOff = this.spriteData.topOff*this.height || 0;
		
			ctx.beginPath();
			ctx.drawImage(game.sprite[frame.source],
				frame.x,frame.y,this.spriteData.frameWidth,this.spriteData.frameHeight,
				this.x-plotOffset.x-leftOff, this.plotY()-plotOffset.y-topOff,
				this.width+leftOff+rightOff,this.height+topOff);	
			
			/* for debugging - render the collision area as a rectangle
			ctx.beginPath();
			ctx.rect(this.x-plotOffset.x, this.plotY()-plotOffset.y,this.width,this.height);
			ctx.stroke();
			*/
		};
		that.render = render;
				
		var isOnGround = function(){
			var block = game.session.items.filter(function(i){return i.type == 'block'});
			block.push({x:1,y:100, width:game.level[game.session.currentLevel].width,height:0});
						
			for (var l = 0;l<block.length;l++) {
				if 	(  this.y <= ( block[l].y + block[l].height) 
					&&(  this.y + this.fallSpeed) >= ( block[l].y + block[l].height) ) {
					
					if ( ( (this.x + this.width) > block[l].x && (this.x + this.width) < block[l].x+block[l].width) 
							|| ( this.x > block[l].x && this.x < block[l].x+block[l].width)) {	
						return block[l];
					};
					
				};
			};	
			return false;
		}
		that.isOnGround = isOnGround;
		
		var findImpactPoint = function () {
			var block = game.session.items.filter(function(i){return i.type == 'block'});
			var impacts = [];
			var consolidatedPoint = {};
			
			block.push({x:0,y:0,width:1,height:game.level[game.session.currentLevel].height,isObstacle:true});
			block.push({x:game.level[game.session.currentLevel].width,y:0,width:1,height:game.level[game.session.currentLevel].height,isObstacle:true});
			block.push({x:-1,y:99, width:game.level[game.session.currentLevel].width,height:1});

			for (var l = 0;l<block.length;l++) {
				if (block[l].isObstacle) {
					if (game.calc.areIntersecting(block[l],this)) {
						impacts.push({block:block[l], side:game.calc.intersectionSide(this,block[l])});
					}
				} else {
					if (game.calc.willLandOn(this,block[l])) {
						impacts.push({block:block[l],side:'top'});
					}
				};
			};
			if (impacts.length === 0) {return false};
			
			for (var l = 0;l<impacts.length;l++) {
				if (impacts[l].side === 'top') { 
					consolidatedPoint['top'] = (typeof(consolidatedPoint['top'] === 'undefined' )) ?
						impacts[l].block.y + impacts[l].block.height:
						Math.max(impacts[l].block.y + impacts[l].block.height, consolidatedPoint['top']);
					consolidatedPoint.bounce = impacts[l].block.bounce || 0;
				};
				if (impacts[l].side === 'bottom') { 
					consolidatedPoint['bottom'] = (typeof(consolidatedPoint['bottom'] === 'undefined' )) ?
						impacts[l].block.y :
						Math.min(impacts[l].block.y, consolidatedPoint['bottom']);
				};
				if (impacts[l].side === 'right') { 
					consolidatedPoint['right'] = (typeof(consolidatedPoint['right'] === 'undefined' )) ?
						impacts[l].block.x + impacts[l].block.width:
						Math.max(impacts[l].block.x + impacts[l].block.width, consolidatedPoint['right']);
				};
				if (impacts[l].side === 'left') { 
					consolidatedPoint['left'] = (typeof(consolidatedPoint['left'] === 'undefined' )) ?
						impacts[l].block.x :
						Math.min(impacts[l].block.x, consolidatedPoint['left']);
				};
			};
			return consolidatedPoint;
		}
		that.findImpactPoint = findImpactPoint;

		var move = function() {	
			if (this.action === 'walk') {
				if (this.direction === 'left') {
					if (this.speed > -this.maxSpeed) {
						this.speed -= this.acceleration;
					}
				};
				if (this.direction === 'right') {
					if (this.speed < this.maxSpeed) {
						this.speed += this.acceleration;
					}
				};
			};
			if (this.action === 'stand') {this.speed = 0};
			
			if (!this.isOnGround()) {
				this.fallSpeed += 1;
				this.setAction('jump');
			};
			
			this.x += this.speed;
			this.y -= this.fallSpeed;
			
			var impact = this.findImpactPoint();
			if (impact){
				this.behaviourTrigger.push( {type:'hitWall', data:impact} );
				if (impact.top) {					
					this.y = impact.top;
					
					this.fallSpeed = -Math.floor(this.fallSpeed*impact.bounce);					
					if(	this.fallSpeed >= -1) {;						
						game.sound.play('land.mp3');
						this.fallSpeed = 0;
						this.setAction('stand');
					} else {
						game.sound.play('bounce.mp3');
					}
					
				};
				if (impact.bottom ) {
					game.sound.play('land.mp3');
					this.fallSpeed = 0;
					this.y = impact.bottom-this.height;
				};
				if (impact.left) {
					this.speed = 0;
					this.x = ( impact.left - this.width - 1);
				};
				if (impact.right) {
					this.speed = 0;
					this.x = ( impact.right + 1);
				};
			};
			

		};
		that.move = move;
				
		return that;
	};

	game.make.flyingCharacter = function(spec) {
		var that = game.make.character(spec);
		
		var move = function() {
			if (this.action === 'walk') {
				if (this.direction === 'left') {
					if (this.speed > -this.maxSpeed) {
						this.speed -= this.acceleration;
					}
				};
				if (this.direction === 'right') {
					if (this.speed < this.maxSpeed) {
						this.speed += this.acceleration;
					}
				};
			};
				
			var impact = this.findImpactPoint();
			if (impact){
				this.behaviourTrigger.push ( {type:'hitWall', data:impact} );
				this.speed = 0;
				this.fallSpeed = 2;
				this.setAction('die');
			};
			
			this.x += this.speed;
			this.y -= this.fallSpeed;
		};
		that.move = move;
		
		return that;
	};

	game.make.man = function(spec) {
		var that = game.make.character(spec);
		that.type = 'man';
		that.spriteData = spec.sprite ? game.spriteData[spec.sprite] : game.spriteData['man'];
		
		that.height = that.spriteData.frameHeight*6;
		that.width = that.spriteData.frameWidth*6;
		that.height = 80;
		that.width = 40;

		that.maxSpeed = spec.maxSpeed || 10;
		that.jumpForce = spec.jumpForce || 22;
		that.acceleration = spec.acceleration || 0.75;
		
		that.hit.monster = function(monster){
			if (!this.isGod) {
				this.speed = 0;
				this.setAction('die');
			}
		}
			
		return that;
	};

	game.make.monster = function(spec) {
		
		if (spec.flying){
			var that = game.make.flyingCharacter(spec);
			that.height = spec.height || 50;
			that.width = spec.height || 50;
		} else {
			var that = game.make.character(spec);
			that.height = spec.height || 90;
			that.width = spec.width || 60;
		}
		
		that.type = 'monster';
		that.spriteData = spec.sprite ? game.spriteData[spec.sprite] : game.spriteData['orc'];
		
		that.maxSpeed = spec.maxSpeed || 4;
		that.jumpForce = spec.jumpForce || 20;
		that.acceleration = spec.acceleration || 0.50;
				
		that.hit.monster = function(monster){
			this.behaviourTrigger.push( {type:'hitMonster', data:monster} );
		}
		
		return that;
	};

	game.make.bigBat = function(spec){
		spec.flying = true;
		spec.sprite = 'bat';
		var that = game.make.monster(spec);
		that.height = spec.height || 90;
		that.width = spec.height || 90;
		return that;
	};

	game.calc.intersectionSide = function (movingObject,hitObject) {
		var side, leadingCorner = {}, blockCorner = {};
		
		if (movingObject.speed === 0 && movingObject.fallSpeed === 0) {
			return 'false';
		}
		
		if (movingObject.speed === 0) {
			side = movingObject.fallSpeed > 0 ? 'top' : 'bottom';
			return side;
		};
		if (movingObject.fallSpeed === 0 ) {
			side = movingObject.speed > 0 ? 'left' : 'right';
			return side;
		};
		
		leadingCorner.x = movingObject.speed > 0 ? movingObject.x + movingObject.width : movingObject.x;
		leadingCorner.y = movingObject.fallSpeed < 0 ? movingObject.y + movingObject.height : movingObject.y;
		blockCorner.x = movingObject.speed < 0 ? hitObject.x + hitObject.width : hitObject.x;
		blockCorner.y = movingObject.fallSpeed > 0 ? hitObject.y + hitObject.height : hitObject.y;
			
		var timeForLeadingCornerToReachX = (blockCorner.x - leadingCorner.x) / movingObject.speed;
		var timeForLeadingCornerToReachY = (blockCorner.y - leadingCorner.y) / -movingObject.fallSpeed;
		
		if (timeForLeadingCornerToReachX > timeForLeadingCornerToReachY) {
			side = movingObject.speed > 0 ? 'left' : 'right'; 
		} else{
			side = movingObject.fallSpeed > 0 ? 'top' : 'bottom';
		};
		return side;
	};

	game.calc.willLandOn =  function(movingObject,hitObject) {		
		if 	(  movingObject.y < ( hitObject.y + hitObject.height) 
			&&(  movingObject.y + movingObject.fallSpeed) >= ( hitObject.y + hitObject.height) ) {
			if ( ( movingObject.x > hitObject.x && movingObject.x < hitObject.x+hitObject.width) 
					|| ( movingObject.x+movingObject.width > hitObject.x && movingObject.x+movingObject.width < hitObject.x+hitObject.width)) {	
				return true;
			};
		};
		return false;
	};


return game;
}