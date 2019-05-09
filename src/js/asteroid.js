
var	game = {
		timer:0, cycleCount:0, numberOfCyclesBetweenCheckingLevelEnds:10, 
		keyMap:{}, startingLives:2,
		soundFiles :['bang.mp3','die.mp3','zap.mp3','laser.mp3'], 
		sound : {
			path : "../sounds/",
			play(choosenSound) {
				this[choosenSound].play();
			},
			stop(choosenSound) {
				this[choosenSound].pause();
			}
		},
		
		level:[
			{width:1000,height:1000, 
				items: [
					{func:'rock', spec:{maxSpeed:15, x:600,y:200,momentum:{m:2.4,h:Math.PI * 1.1}, size:150}},
					{func:'rock', spec:{maxSpeed:15, x:800,y:700,momentum:{m:2.1,h:Math.PI * 0.1}, size:120}},
					{func:'rock', spec:{maxSpeed:15, x:300,y:700,momentum:{m:2.1,h:Math.PI * 0.1}, size:90}},
					{func:'rock', spec:{maxSpeed:15, x:100,y:401,momentum:{m:1.4,h:Math.PI * 2.3}, size:90}}
				],
				effects:[
					{type:'message',message:'Press space bar to start', animateFrame:0, lastFrame:-1}
				],
				victoryCondition() {
					return game.keyMap[" "];
				}
			},
			{width:1000,height:1000,
				items: [
					{func:'ship', spec:{x:500,y:500, h:0.2,color:'blue'}, isPlayer:true},
					{func:'rock', spec:{maxSpeed:15, x:100,y:401, size:80}}
				],
				effects:[
					{type:'message',message:'Blow up the rock!', animateFrame:0, lastFrame:50}
				],
				victoryCondition() {
					return (game.session.items.filter(function(a){ return a.type == 'rock'; } ).length === 0);
				}
			},
			{width:4000,height:1000, numberOfStars:200, score:1000,
				items: [
					{func:'ship', spec:{x:50,y:500, h:Math.PI*0.5,color:'blue'}, isPlayer:true},
					{func:'ship', spec:{x:750,y:350, h:Math.PI*1,color:'red',thrust:0.04}},
					{func:'planet', spec:{x:800,y:100,size:100,density:150,color:'green'}},
					{func:'ringedPlanet', spec:{x:1300,y:600,size:80,density:100}},
					{func:'planet', spec:{x:1700,y:300,size:20,density:200,color:'red'}},
					{func:'planet', spec:{x:2100,y:800,size:20,density:200,color:'red'}},
					{func:'planet', spec:{x:2200,y:200,size:80,density:100}},
					{func:'planet', spec:{x:3000,y:1100,size:500,density:150,color:'green'}},
				],
				effects:[
					{type:'message',message:'Get to the far end!', animateFrame:0, lastFrame:50}
				],
				victoryCondition() {
					return (game.session.player.x > this.width-250);
				}
			},
			{width:1000,height:1000,
				items: [
					{func:'ship', spec:{x:500,y:500, h:.2,color:'blue'}, isPlayer:true},
					{func:'rock', spec:{maxSpeed:15, x:600,y:200,momentum:{m:2.4,h:Math.PI * 1.1}, size:120}},
					{func:'rock', spec:{maxSpeed:15, x:800,y:700, size:60}},
					{func:'rock', spec:{maxSpeed:15, x:100,y:401, size:120}}
				],
				victoryCondition() {
					return (game.session.items.filter(function(a){ return a.type == 'rock' } ).length === 0);
				}
			},
			{width:1000,height:1000,
				items: [
					{func:'ship', spec:{x:500,y:500, h:.2,color:'blue'}, isPlayer:true},
					{func:'rock', spec:{maxSpeed:15, x:600,y:200,momentum:{m:2,h:Math.PI * Math.random()*2}, size:120}},
					{func:'rock', spec:{maxSpeed:15, x:800,y:700,momentum:{m:2,h:Math.PI * Math.random()*2}, size:60}},
					{func:'rock', spec:{maxSpeed:15, x:100,y:401,momentum:{m:2,h:Math.PI * Math.random()*2}, size:60}},
					{func:'rock', spec:{maxSpeed:15, x:400,y:101,momentum:{m:2,h:Math.PI * Math.random()*2}, size:60}},
				],
				victoryCondition() {
					return (game.session.items.filter(function(a){ return a.type == 'rock' } ).length === 0);
				}
			},
		],
		
		session : {
			items : [],
			star : [],
			effect:[],
			player:{},
			currentLevel : 0,
			score:0,
			lives:2,
			gameOver:false,
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
		},
		
		initialise(outputs) {
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
			}
						
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
			}
			
		},
		
		setUpLevel(level) {
			var effectClone, numberOfStars, init;
			
			if (level !== game.session.currentLevel || level === 0 ) {
				numberOfStars = game.level[level].numberOfStars || (game.level[level].width * game.level[level].height) / 10000 ;
				this.generateStarField(numberOfStars);
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
		},
		
		refresh() {
			var timeStamp = new Date();
			var impact, m;
			
			if (this.session.gameStatus === 'play') {
				if (this.session.player.crashed === false) {this.reactToControls()};
				for (m=0;m<this.session.items.length;m++) {
					this.session.items[m].automaticAction();
					if (this.session.items[m].crashed === false && typeof(this.session.items[m].move) === 'function') {
						impact = this.session.items[m].collisionTest(this.session.items[m].move(),this.session.items);
						if (impact) {
							this.session.items[m].handleCollision(impact);
						};
					};
				}
				function checkCrashed(item) {return item.crashed==false}
				this.session.items = this.session.items.filter(checkCrashed);
				
				if (game.cycleCount % game.numberOfCyclesBetweenCheckingLevelEnds === 0 || game.session.currentLevel === 0 ) {
					this.checkIfLevelFinished();
					if (game.session.player.crashed == true && game.session.waitingToReset === false) {
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
		},
		
		reactToHighscoreEntry() {
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
		},
				
		reactToControls() {
			var ship = this.session.player;
			if (this.keyMap["ArrowLeft"])  {ship.h += 0.025 * Math.PI;};
			if (this.keyMap["ArrowRight"]) {ship.h -= 0.025 * Math.PI;};
			if (this.keyMap["ArrowUp"]) {ship.thrust += 0.05 };
			if (this.keyMap["ArrowDown"]) {ship.thrust -= 0.1 };	
			if (this.keyMap["z"]) {ship.momentum.m = 0.0 };	
			if (this.keyMap["x"]) {ship.h = ship.momentum.h;};
			if (this.keyMap["c"]) {ship.h = game.calc.reverseHeading(ship.momentum.h);};		
			if (this.keyMap[" "]) {		
				ship.launchProjectile();
				this.keyMap[" "] = false;
			};			
			ship.thrust = Math.min(ship.thrust,1);
			ship.thrust = Math.max(ship.thrust,0);
		},
		
		renderScreen() {
			var c = this.canvasElement;
			var ctx = c.getContext("2d");
			var star,effect,thrustFlicker = 75,rgbString, plotOffset = {}, statusLineText='', highscoreNameText='';
			
			if (this.scoreElement) {
				if (this.session.currentLevel === 0) {
					this.scoreElement.style.display = 'block';
				} else {
					this.scoreElement.style.display = 'none';
				}
			}
			
			plotOffset.x = Math.min(game.level[game.session.currentLevel].width-1000,Math.max(this.session.player.x-500,0)) || 0;
			plotOffset.y = Math.min(game.level[game.session.currentLevel].height-1000,Math.max(this.session.player.y-500,0)) || 0;			
			
			ctx.fillStyle = "#000000";
			ctx.fillRect(0,0,c.width,c.height);
			ctx.lineWidth = 1;
			
			for (p=0;p<this.session.star.length;p++) {
				star = this.session.star[p];
				ctx.beginPath();
				ctx.fillStyle = star.flickerCycle[star.flickerState];
				star.flickerState++;
				if (star.flickerState === star.flickerCycle.length) {star.flickerState = 0};
				ctx.fillRect(star.x-(plotOffset.x/star.parallax),star.y-(plotOffset.y/star.parallax),2,2);
			}
			
			if (this.session.gameStatus === 'play') {
				for (p=0;p<this.session.items.length;p++) {
					if (this.session.items[p].crashed == false) {
						this.session.items[p].render(ctx,plotOffset,thrustFlicker)
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
			
		},
		
		checkIfLevelFinished () {
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
		},
		
		handleDeadPlayer () {
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
		},
		
		make: {
			body(spec) {
				var that = {},massValue = spec.mass||1;
				that.x = spec.x || 0 ;
				that.y = spec.y || 0;
				that.h = spec.h*Math.PI || 0;
				that.density = spec.density || 1;
				that.size = spec.size || 20;
				that.color = spec.color || 'gray';		
				that.crashed = false;
				
				mass = function () {return massValue};
				that.mass = mass;
				
				handleCollision = function(impactPoint) {				
					if (typeof(this.hit[impactPoint.impactedBody.type]) === 'function') {this.hit[impactPoint.impactedBody.type].apply(this,[impactPoint])}
					if (typeof(impactPoint.impactedBody.hit[this.type]) === 'function') {impactPoint.impactedBody.hit[this.type].apply(impactPoint.impactedBody,[impactPoint,true])}
				};
				that.handleCollision = handleCollision;
				that.hit={};
				
				automaticAction = function() {return false};
				that.automaticAction = automaticAction;
				
				return that;
			},

			movingBody(spec) {
				var that = game.make.body(spec);
				that.maxSpeed = spec.maxSpeed || 20;
				that.thrust = spec.thrust || 0;
				that.momentum = spec.momentum || {h:0,m:0};
							
				var move = function() {			
					var force=[], velocity = {x:0,y:0};
					var gravitySources = game.session.items.filter(function(item){return item.type  == 'planet'});
					//var gravitySources = game.session.items.filter(function(item){return item.mass() > 10});
					var len = gravitySources.length;
					var gForce;
					
					//find forces, calculate velocity				
					force.push({m:(this.momentum.m), h:this.momentum.h });
					if (this.thrust > 0) { 
						force.push( {m:(this.thrust/this.mass()), h:this.h} );
					};
					for (p=0; p<len; p++) {
						gForce = game.calc.gravity(gravitySources[p],this);
						if (isFinite(gForce)){
							force.push({m:gForce,h:game.calc.heading(this.x - gravitySources[p].x, this.y - gravitySources[p].y)});
						} else { // handles infinte forces by removing all other forces from  the array
							force = [{m:1,h:game.calc.heading(this.x - gravitySources[p].x, this.y - gravitySources[p].y)}];
							console.log('infinite force ');
							p=len;
						}
					}
					velocity = game.calc.vectorFrom(force);
			
					
					//move body, update momentum
					this.x -= velocity.x;	this.y -= velocity.y;
					this.momentum.h = game.calc.heading(velocity.x,velocity.y);
					this.momentum.m = game.calc.distance(velocity);
					this.momentum.m = Math.min(this.momentum.m,this.maxSpeed);
						
					if (this.x > game.level[game.session.currentLevel].width) {this.x -= game.level[game.session.currentLevel].width}
					if (this.x < 0) {this.x += game.level[game.session.currentLevel].width}
					if (this.y > game.level[game.session.currentLevel].height) {this.y -= game.level[game.session.currentLevel].height}
					if (this.y < 0) {this.y += game.level[game.session.currentLevel].height}
			
					return velocity;			
				};
				that.move = move;
				
				var collisionTest = function(vector,bodyArray) {
					var impactPoint, loopLength = bodyArray.length;
					for (p=0; p<loopLength; p++) {
						if (this.size > 20 ) {
							impactPoint = checkForCircleCollisions(this,vector,bodyArray[p]); 					
						} else {
							impactPoint = checkForCollisions(this,vector,bodyArray[p]); 					
						}					
					
						if (impactPoint ) { return impactPoint;};
					}	
					return false;
					function checkForCollisions(movedObject, vector, body) {
							
							// can't collide with self!
							if (movedObject === body) {return false};
							
							var movedObjectStartPoint = {
								x:(movedObject.x+vector.x),
								y: (movedObject.y+vector.y)
							};
							
							// should add quick 1d tests here to rule out distant objects quickly
							
							if (game.calc.distance(movedObjectStartPoint,body) < body.size-5) { // started inside body, with 5pt tolerance
								//console.log('inside');
								return {x:movedObjectStartPoint.x, y:movedObjectStartPoint.y, impactedBody:body,impactingBody:movedObject};
							}
							
							var LAB = game.calc.distance(movedObjectStartPoint,movedObject);
							var Dx  = (movedObject.x - movedObjectStartPoint.x)/LAB;
							var Dy  = (movedObject.y - movedObjectStartPoint.y)/LAB;
							
							var t = Dx*(body.x-movedObjectStartPoint.x) + Dy*(body.y-movedObjectStartPoint.y);
							
							var E = {
							 x:(t*Dx+movedObjectStartPoint.x),
							 y:(t*Dy+movedObjectStartPoint.y)
							};
							
							var LEC = game.calc.distance(E,body);
							
							if (LEC < body.size){
								var dt = Math.sqrt( (body.size*body.size) - (LEC*LEC) ); 
								
								var F = { //first collision point
									x:( (t-dt)*Dx + movedObjectStartPoint.x ),
									y:( (t-dt)*Dy + movedObjectStartPoint.y )
								};
								
								var G = { // second collision point (not used)
									x:((t+dt)*Dx + movedObjectStartPoint.x),
									y:((t+dt)*Dy + movedObjectStartPoint.y)
								};						
								
								if (vector.x !== 0) {
									if (
										(movedObjectStartPoint.x < F.x && F.x < movedObject.x) ||
										(movedObjectStartPoint.x > F.x && F.x > movedObject.x)
									) {
										return {x:F.x, y:F.y, impactedBody:body, impactingBody:movedObject, stopPoint:F};
									}
								} else { //no x velocity, so check by y coords
									if (
										(movedObjectStartPoint.y < F.y && F.y < movedObject.y) ||
										(movedObjectStartPoint.y > F.y && F.y > movedObject.y)
									) {
										return {x:F.x, y:F.y, impactedBody:body,impactingBody:movedObject,stopPoint:F};
									}
								}
								
							}
							return false; 
						}
					
					function checkForCircleCollisions(movedObject, vector, body) {
						// can't collide with self!
						if (movedObject === body) {return false};
							
						var movedObjectStartPoint = {
							x:(movedObject.x+vector.x),
							y: (movedObject.y+vector.y)
						};
						
						// add test : circles already overlapping?	
							
							if (game.calc.distance(movedObjectStartPoint,body) < (body.size + movedObject.size) ) {
								
								var dx = movedObject.x - body.x; 
								var dy = movedObject.y - body.y;
								
								var pushHeading = game.calc.heading(dx,dy);
								var pushDistance = ((body.size + movedObject.size) - game.calc.distance(movedObjectStartPoint,body))/10;
								
								var pushVector = game.calc.vectorFrom([{m:pushDistance,h:pushHeading}],2);
							
								
								return {x:pushVector.x, y:pushVector.y, impactedBody:body,impactingBody:movedObject, stopPoint:c, overlapping:true};
								
							} 
							
							
							// more efficient to compare squares but the calc.distance function finds the roots 
							var d = game.calc.closestpointonline(movedObjectStartPoint,movedObject,body);											
							
							var closestDist = game.calc.distance(body,d);		
							var closestDistSq = closestDist*closestDist;
							if(closestDist <= body.size + movedObject.size){ //collision course 						
								var backdist = Math.sqrt(Math.pow(movedObject.size + body.size, 2) - closestDistSq); 
								var movementvectorlength = game.calc.distance(vector);
								var c = {
								x:d.x + backdist * (vector.x / movementvectorlength)
								,
								y:d.y + backdist * (vector.y / movementvectorlength)
								};
								
							
								var objectMovesThroughC = false;
								if (vector.x !== 0) {
									if (
										(movedObjectStartPoint.x < c.x && c.x < movedObject.x) ||
										(movedObjectStartPoint.x > c.x && c.x > movedObject.x)
									) {
										objectMovesThroughC = true;
									}
								} else { //no x velocity, so check by y coords
									if (
										(movedObjectStartPoint.y < c.y && c.y < movedObject.y) ||
										(movedObjectStartPoint.y > c.y && c.y > movedObject.y)
									) {
										objectMovesThroughC = true;
									}
								}
								
								if ( objectMovesThroughC ) { 
									var i ={
										x:c.x + (movedObject.size * -Math.sin(game.calc.heading(c.x-body.x,c.y-body.y)) ),
										y:c.y + (movedObject.size * -Math.cos(game.calc.heading(c.x-body.x,c.y-body.y)) )
										}; 
								 return {x:i.x, y:i.y, impactedBody:body,impactingBody:movedObject, stopPoint:c};
								}
								
							} 
							return false;
							
					}
				};
				that.collisionTest = collisionTest;
				return that;
			},

			ship(spec) {
				var that = game.make.movingBody(spec);
				that.type = 'ship';
				
				var launchProjectile = function(makeFunction) {
					var newBulletVector= game.calc.vectorFrom([  {m:this.momentum.m, h:this.momentum.h} , {m:10,h:this.h}  ]);
					var newBulletMomentum={};
					newBulletMomentum.m = Math.min(game.calc.distance(newBulletVector),30);
					newBulletMomentum.h = game.calc.heading(newBulletVector.x,newBulletVector.y);
					
					makeFunction = makeFunction || game.make.bullet;
					var newBulletSpec = {
						x:this.x - newBulletVector.x*2.5,
						y:this.y - newBulletVector.y*2.5,
						h:(this.h/Math.PI),
						mass:1.5,
						lifeSpan:75,
						momentum:{m:newBulletMomentum.m, h:newBulletMomentum.h},
						maxSpeed:30
					};
					
					game.sound.play('laser.mp3');
					game.session.items.push( makeFunction(newBulletSpec));
				}
				that.launchProjectile = launchProjectile;
				
				var explode = function(impactPoint) {
					this.x = impactPoint.x;
					this.y = impactPoint.y;
					this.crashed = true;
					this.momentum.m=0;
					game.session.effect.push({
						x:impactPoint.x,
						y:impactPoint.y,
						animateFrame:5,
						lastFrame:55,
						type:'expandingRing'
					});
					game.sound.play('die.mp3');
				}
				that.hit.planet = explode;
				that.hit.rock = explode;
				that.hit.bullet = explode;
				
				render = function (ctx,plotOffset,thrustFlicker){
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo(this.x-(Math.sin(this.h)*15) - plotOffset.x, this.y-(Math.cos(this.h)*15) - plotOffset.y);
					ctx.lineTo(this.x+(Math.sin(this.h-.5)*15) - plotOffset.x, this.y+(Math.cos(this.h-.5)*15) - plotOffset.y);
					ctx.lineTo(this.x+(Math.sin(this.h+.5)*15) - plotOffset.x, this.y+(Math.cos(this.h+0.5)*15) - plotOffset.y);
							
					ctx.strokeStyle = 'white';
					ctx.stroke();
					ctx.fillStyle = this.color;
					ctx.fill();
					
					if (this.thrust > 0) {
						ctx.beginPath();
						ctx.moveTo(this.x+(Math.sin(this.h-.5)*15)- plotOffset.x, this.y+(Math.cos(this.h-.5)*15)- plotOffset.y);		
						ctx.bezierCurveTo(
							this.x+(Math.sin(this.h-.4)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.x,
							this.y+(Math.cos(this.h-.3)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.y,
							this.x+(Math.sin(this.h+.4)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust)))- plotOffset.x,
							this.y+(Math.cos(this.h+.3)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.y,
							this.x+(Math.sin(this.h+.5)*15) - plotOffset.x,
							this.y+(Math.cos(this.h+0.5)*15) - plotOffset.y
						);
						ctx.strokeStyle = 'red';
						ctx.stroke();
						ctx.fillStyle = 'cyan';
						ctx.fill();
					}
				}
				that.render = render;
				
				return that;
			},
			
			uglyShip(spec) {
				var that = game.make.ship(spec);
				
				var render = function(ctx,plotOffset,thrustFlicker){		
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo(this.x-(Math.sin(this.h)*15) - plotOffset.x, this.y-(Math.cos(this.h)*15) - plotOffset.y);
					ctx.lineTo(this.x+(Math.sin(this.h-.8)*15) - plotOffset.x, this.y+(Math.cos(this.h-.8)*15) - plotOffset.y);
					ctx.lineTo(this.x+(Math.sin(this.h+.8)*15) - plotOffset.x, this.y+(Math.cos(this.h+0.8)*15) - plotOffset.y);
							
					ctx.strokeStyle = 'blue';
					ctx.stroke();
					ctx.fillStyle = this.color;
					ctx.fill();
					
					if (this.thrust > 0) {
						ctx.beginPath();
						ctx.moveTo(this.x+(Math.sin(this.h-.5)*15)- plotOffset.x, this.y+(Math.cos(this.h-.5)*15)- plotOffset.y);		
						ctx.bezierCurveTo(
							this.x+(Math.sin(this.h-.4)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.x,
							this.y+(Math.cos(this.h-.3)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.y,
							this.x+(Math.sin(this.h+.4)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust)))- plotOffset.x,
							this.y+(Math.cos(this.h+.3)*(25 + Math.floor(Math.random()*thrustFlicker*this.thrust))) - plotOffset.y,
							this.x+(Math.sin(this.h+.5)*15) - plotOffset.x,
							this.y+(Math.cos(this.h+0.5)*15) - plotOffset.y
						);
						ctx.strokeStyle = 'green';
						ctx.stroke();
						ctx.fillStyle = 'yellow';
						ctx.fill();
					}
				};
				that.render = render;

				return that;
			},
			
			bullet(spec){
				var that = game.make.movingBody(spec);
				that.lifeSpan = spec.lifeSpan || -1;
				that.type = 'bullet';
				
				var drainLifeSpan = function() {
					this.lifeSpan--;
					if (this.lifeSpan === 0 ) {that.crashed = true;};
				}
				that.drainLifeSpan = drainLifeSpan;
				
				
				var automaticAction = function (){
					this.drainLifeSpan();
					this.h = this.momentum.h;
				}
				that.automaticAction = automaticAction;
				
				var explode = function(impactPoint) {
				this.crashed = true;
				game.session.effect.push({
						x:impactPoint.x,
						y:impactPoint.y,
						animateFrame:3,
						lastFrame:10,
						type:'expandingRing'
				});
				}
				that.hit.ship = explode;
				that.hit.rock = explode;
				
				var hitPlanet = function(impactPoint) {
					this.x = impactPoint.x;
					this.y = impactPoint.y;				
					
					this.momentum.h = game.calc.reflectHeading(this.momentum.h , game.calc.tangent(impactPoint.impactedBody,impactPoint) );
					this.momentum.m = this.momentum.m * .95;
					if (this.momentum.m<15) {this.crashed = true}
				
					impactPoint.impactedBody.size +=1;
					game.sound.play('zap.mp3');
					game.session.effect.push({
						x:impactPoint.x,
						y:impactPoint.y,
						animateFrame:5,
						lastFrame:55,
						type:'sparks'
					});
				}
				that.hit.planet = hitPlanet;
				
				var render = function(ctx,plotOffset) {		
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo(this.x-(Math.sin(this.h)*5) - plotOffset.x, this.y-(Math.cos(this.h)*5) - plotOffset.y);
					ctx.lineTo(this.x+(Math.sin(this.h)*6) - plotOffset.x, this.y+(Math.cos(this.h)*6) - plotOffset.y);
					
					ctx.arc(this.x-(Math.sin(this.h)*5) - plotOffset.x, this.y-(Math.cos(this.h)*5) - plotOffset.y,4,0,2*Math.PI);
					ctx.arc(this.x+(Math.sin(this.h)*5) - plotOffset.x, this.y+(Math.cos(this.h)*5) - plotOffset.y,2,0,2*Math.PI);
					
					//rgbString = 'rgb(' + (this.lifeSpan+10) + ',' + (this.lifeSpan+20) + ',' + (this.lifeSpan+5) + ')';
					ctx.strokeStyle = 'white';
					ctx.stroke();
					
					rgbString = 'rgb(' + (this.lifeSpan) + ',' + (100+this.lifeSpan) + ',' + (this.lifeSpan) + ')';
					ctx.fillStyle = rgbString;
					ctx.fill();
				}
				that.render = render;
				
				return that;		
			},
			
			planet(spec) {
				var that = game.make.body(spec);
				that.mass = function(){return this.density * this.size * Math.PI*2};
				that.type = 'planet';
				render = function(ctx,plotOffset) {
					var grd=ctx.createRadialGradient(
						this.x - plotOffset.x,this.y - plotOffset.y,this.size*0.75,
						this.x - plotOffset.x,this.y - plotOffset.y,this.size
					);
					grd.addColorStop(0,this.color);
					grd.addColorStop(1,"black");
					
					ctx.beginPath();
					ctx.fillStyle = grd;
					ctx.arc(this.x- plotOffset.x,this.y - plotOffset.y,this.size,0,2*Math.PI);
					ctx.fill();	
				}
				that.render = render;						
				return that;
			},
			
			ringedPlanet(spec) {
				var that = game.make.planet(spec);
				that.ringColor = spec.ringColor || 'white';
				var superRender = game.make.planet(spec).render;			
				render = function(ctx,plotOffset) {
					superRender.apply(this,[ctx,plotOffset]);
					ctx.beginPath();
					ctx.strokeStyle = this.ringColor;
					ctx.lineWidth = this.size/10;
					ctx.moveTo(
						this.x - (this.size)- plotOffset.x , this.y - plotOffset.y
					)
					ctx.bezierCurveTo(
						this.x - (this.size) - plotOffset.x, this.y + (this.size* 1/3)- plotOffset.y,
						this.x + (this.size) - plotOffset.x, this.y + (this.size* 1/3)- plotOffset.y,
						this.x + (this.size)- plotOffset.x , this.y - plotOffset.y
					);
					ctx.stroke();
				}
				that.render = render;
				
				return that;
			},
			
			rock(spec) {
			var that = game.make.movingBody(spec)
			that.type = 'rock';
			that.mass = function(){return this.density * this.size * Math.PI*2};
			vary = function(){return ((Math.floor(Math.random()*10)/100)-0.05)*2 }
			
			
			that.shape = [
				{r:0.95+vary() , a:(vary() + 0.0)* Math.PI },
				{r:1, a:(vary() + 0.2)* Math.PI },
				{r:0.95+vary() , a:(vary() + 0.4)* Math.PI },
				{r:1 , a:(vary() + 0.6)* Math.PI },
				{r:1 , a:(vary() + 0.8)* Math.PI },
				{r:0.95+vary() , a:(vary() + 1.0)* Math.PI },
				{r:1 , a:(vary() + 1.2)* Math.PI },
				{r:0.95+vary() , a:(vary() + 1.4)* Math.PI },
				{r:1 , a:(vary() + 1.6)* Math.PI },
				{r:0.95+vary() , a:(vary() + 1.8)* Math.PI },
			]; 
			var render = function(ctx,plotOffset) {
				ctx.beginPath();
				ctx.fillStyle = this.color;
				ctx.strokeStyle = 'white';
				
				ctx.moveTo(this.x+(Math.sin(this.shape[0].a + this.h)*this.shape[0].r* this.size) - plotOffset.x, this.y+(Math.cos(this.shape[0].a + this.h)*this.shape[0].r* this.size) - plotOffset.y);
				for (z=0; z < this.shape.length; z++) {
					ctx.lineTo(
						this.x+(Math.sin(this.shape[z].a + this.h)*this.shape[z].r * this.size) - plotOffset.x, 
						this.y+(Math.cos(this.shape[z].a + this.h)*this.shape[z].r * this.size) - plotOffset.y);
				}
				ctx.moveTo(this.x+(Math.sin(this.shape[0].a + this.h)*this.shape[0].r* this.size) - plotOffset.x, this.y+(Math.cos(this.shape[0].a + this.h)*this.shape[0].r* this.size) - plotOffset.y);
				//ctx.closePath();
				ctx.stroke();
				ctx.fill()
			};
			that.render = render
			
			var shatter = function(impactPoint) {
				this.crashed = true;
				game.session.score += Math.max(250-this.size, 100);
				if (this.size > 40 ) {			
					var randomHeading = game.calc.round(Math.random()*2,3);
					var randomSpeed = game.calc.round(Math.random()*3,3);
					
					var shardVector1 = game.calc.vectorFrom([this.momentum, {h:randomHeading,m:randomSpeed}],3);
					var shardMomentum1 ={
						m: game.calc.distance(shardVector1) ,
						h: game.calc.heading(shardVector1.x,shardVector1.y)
					};
					
					var shift = 0.7*this.size/shardMomentum1.m 
					shift = 0;
					
					game.session.items.push( game.make.rock({x:this.x-(shardVector1.x*shift),y:this.y-(shardVector1.y*shift), momentum:shardMomentum1, size:Math.floor(this.size*0.7) }) );

					var shardVector2 = game.calc.vectorFrom([this.momentum, {h:game.calc.reverseHeading(randomHeading),m:randomSpeed}],3);
					var shardMomentum2 ={
						m: game.calc.distance(shardVector2) ,
						h: game.calc.heading(shardVector2.x,shardVector2.y)
					};
					
					var shift = 0.7*this.size/shardMomentum2.m 
					shift = 0;
					game.session.items.push( game.make.rock({x:this.x-(shardVector2.x*shift),y:this.y-(shardVector2.y * shift), momentum:shardMomentum2, size:Math.floor(this.size*0.7)}) );
				}
				game.sound.play('bang.mp3');
				game.session.effect.push({
						x:this.x,
						y:this.y,
						animateFrame:5,
						lastFrame:this.size/2,
						type:'expandingRing'
				});
			}
			that.hit.bullet = shatter;
			
			var bounceOrSeparate = function(impactPoint, thisIsImpactedBody) {
				if (impactPoint.overlapping) {
					separate(impactPoint, thisIsImpactedBody);
				} else {
					bounce(impactPoint, thisIsImpactedBody);
				}
			}
			
			var separate = function(impactPoint, thisIsImpactedBody){
					if (!thisIsImpactedBody) {
						impactPoint.impactingBody.x = impactPoint.impactingBody.x + impactPoint.x;
						impactPoint.impactingBody.y = impactPoint.impactingBody.y + impactPoint.y;
					} 
			}
			
			var bounce = function(impactPoint, thisIsImpactedBody) {
				if (!thisIsImpactedBody) {
					var body1 = impactPoint.impactingBody;
					var body2 = impactPoint.impactedBody
					var vector1 = game.calc.vectorFrom([body1.momentum],3);
					
					var vector2 = body2.momentum ? game.calc.vectorFrom([body2.momentum],3) : {x:0,y:0};
					
					var newVector1 = {};
					newVector1.x = (vector1.x * (body1.mass() - body2.mass()) + (2 * body2.mass() * vector2.x)) / (body1.mass() + body2.mass());			
					newVector1.y = (vector1.y * (body1.mass() - body2.mass()) + (2 * body2.mass() * vector2.y)) / (body1.mass() + body2.mass());
					var newVector2 = {};
					newVector2.x = (vector2.x * (body2.mass() - body1.mass()) + (2 * body1.mass() * vector1.x)) / (body1.mass() + body2.mass());
					newVector2.y = (vector2.y * (body2.mass() - body1.mass()) + (2 * body1.mass() * vector1.y)) / (body1.mass() + body2.mass());
							
					body1.x = impactPoint.stopPoint.x;
					body1.y = impactPoint.stopPoint.y;
					body1.momentum.h = game.calc.heading(newVector1);
					body1.momentum.m = game.calc.distance(newVector1);
					body1.momentum.m = Math.min(body1.momentum.m,body1.maxSpeed);
				
					if (body2.momentum) {
						body2.momentum.h = game.calc.heading(newVector2);
						body2.momentum.m = game.calc.distance(newVector2);
						body2.momentum.m = Math.min(body2.momentum.m,body2.maxSpeed);
					}
				}
			}
			that.hit.rock = bounceOrSeparate;
			that.hit.planet = shatter;
			
			var automaticAction = function(){
				this.h = this.h + 0.02;
			}
			that.automaticAction = automaticAction;
			
			return that;
			},

		},

		generateStarField(number) {
			var patterns=[
				['white'],
				['white'],
				['white'],
				['white'],
				['white'],
				['cyan'],
				['white','white','white','white','white','white','white','white','white','white','white','white','white','white','red','black'],
				['white','white','white','white','white','yellow','black']
			];
			var twinkle=0;
			game.session.star =[];
			for (p=0;p<number+1;p++) {
				twinkle = Math.round(Math.random()*(patterns.length-1));
				game.session.star.push(Star(Math.random()*game.level[game.session.currentLevel].width , Math.random()*game.level[game.session.currentLevel].height,4*(1+Math.floor(Math.random()*3)*2), patterns[twinkle]));
			}
			
			function Star(x,y,p,cycle){
				var newStar = {
					x:x,y:y,
					parallax:p,
					flickerState:0,
					flickerCycle:['white']
				};
			 
			 if (arguments.length > 3) {
					newStar.flickerCycle = cycle; 
			 } 
			 newStar.flickerState = Math.round(Math.random()*(newStar.flickerCycle.length-1));
			 return newStar;
			}
		},
		
		calc:{
			heading(x,y) {
				if (arguments.length == 1 && typeof(arguments[0] === 'object') ) {
					var passedVector = x;
					x = passedVector.x;
					y = passedVector.y;
				}
			
				if (y != 0 && x != 0 ){
					if (y>0) {
						return Math.atan(x/y);
					}					
					if (y<0) {
						return Math.PI + Math.atan(x/y);
					}	
				} 
				if (x == 0 && y == 0 ) {
					return 0;
				} 
				if (y == 0 && x != 0) {
					return x < 0 ? Math.PI*1.5 : Math.PI*0.5;
				}
				if (x == 0 && y != 0) {
					return y > 0 ? 0: Math.PI*1;
				}
			}
			,
			reverseHeading(h){
				var result;
				result = h + Math.PI;
				if (result > Math.PI * 2) {result -= Math.PI * 2}
				return result;
			}
			,
			vectorFrom(forceArray,roundingFactor){
				var result = {x:0,y:0};
				roundingFactor = roundingFactor || 5;
				
				for (a = 0; a<forceArray.length; a++) {
					result.x += forceArray[a].m * Math.sin(forceArray[a].h);
					result.y += forceArray[a].m * Math.cos(forceArray[a].h);
				}		
				
				result.x = game.calc.round(result.x,roundingFactor);
				result.y = game.calc.round(result.y,roundingFactor);
				return result;
			}
			,
			round(number, dp){
				var value = number;
				var pow = Math.pow(10,dp);
				value = value * pow;
				value = Math.round(value) / pow;
				return value;
			}
			,
			gravity(body1,body2) {
				if (body1 === body2) {return 0}
				var G = 0.1;
				var r = game.calc.distance(body1,body2);
				return (G * ((body1.mass() * body2.mass()) / Math.pow(r,2)) );
			}
		  ,
			distance(p1,p2) {
				p2 = p2 || {x:0,y:0};
				return Math.sqrt(  (p1.x-p2.x)*(p1.x-p2.x) +  (p1.y-p2.y)*(p1.y-p2.y))
			}
			,
			reflectHeading(heading,wallAngle) {
			var reflect = 2*wallAngle - heading;
			if (reflect > (Math.PI)*2) {reflect -= (Math.PI)*2};
			return reflect;
			}
			,
			tangent(circle, point) {
				var radiusHeading = game.calc.heading (circle.x - point.x, circle.y - point.y);
				var tangentHeading = radiusHeading + (Math.PI)*0.5;
				if (tangentHeading > (Math.PI)*2) {tangentHeading -= (Math.PI)*2};
				return tangentHeading;
			}
			,
			closestpointonline(L1,L2,p0) {						
				var A1 = L2.y - L1.y;
				var B1 = L1.x - L2.x;
				var C1 = (L2.y - L1.y) * L1.x + (L1.x - L2.x) * L1.y;
				var C2 = -B1* p0.x + A1*p0.y;
				var det = A1*A1  - -B1*B1;
				var cx = 0;
				var cy = 0;
				if (det !== 0 ) {
					cx = ((A1*C1 - B1*C2)/det); 
					cy = ((A1*C2 - -B1*C1)/det); 
				} else {
					cx = p0.x;
					cy = p0.y;
				}
				
				if (isFinite(cx) ==! true ||isFinite(cy) ==! true ) {
					console.log('closestpointonline error');
					console.log ({x:cx,y:cy});
				}
				
				return{x:cx,y:cy};
			}
		}
		
	}

	