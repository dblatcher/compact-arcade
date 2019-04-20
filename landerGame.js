
function landerGame(game, options) {
		
	var VP = game.library.vectorPhysics;
	game.soundFiles.push ('laser.mp3','die.mp3');
	game.spriteFiles.push ('stone.jpg','soil.jpg');
	
	game.touchButtons = [
		{name:'up',type:'hold',x:800,y:600,r:50},
		{name:'down',type:'hold',x:800,y:800,r:50},
		{name:'left',type:'hold',x:100,y:800,r:50},
		{name:'right',type:'hold',x:250,y:800,r:50}
	];
	
	var reportImpact = function(impactPoint,isReversed) {
		if (isReversed) return false;
		
		var message = 'T:' + game.cycleCount + ', ' + impactPoint.item1.color + ' ' + impactPoint.item1.type + ' delivered a ' + impactPoint.force+ 'n force';
		message += ' on a ' + impactPoint.item2.color + ' ' + impactPoint.item2.type; 
		console.log(message);
	};
		
	var descentMeter = {
		render:game.library.defaultWidgets.showText,
		xPos : 180, yPos:50,
		textSize: (4/100),
		font: "monospace",
		textAlign: "right",
		getValue: function() {
			return -game.calc.vectorFromForces([game.session.player.momentum]).y
		},
		getText: function () {
			var value = this.getValue();
			if (value < 0.2 && value > -0.2){value = 0};
			return value.toFixed(2) + "m/s"
		},
		color: function () {
			var green = 255, red = 0, value = this.getValue();
			var dangerSpeed = game.session.player.resiliance / game.session.player.mass;
			
			if (value < 0.5 * dangerSpeed) {green = 255; red = 0}
			else if (value >= dangerSpeed) {green = 0; red = 255}
			else {green = 255; red = 255};
			return "rgb(" + red + "," + green + ",0)";
		}
	}
	
	var fuelMeter = {
		render: game.library.defaultWidgets.barChart,
		xPos:200, yPos:50,
		width:40, height:100, margin:5,
		getRange:function(){return game.session.player.fuelCapacity},
		getValue:function(){return game.session.player.fuel},
		barFill:'white',
		chartFill:"rgba(200, 200, 200, 0.3)",
	};
	
	var fuelMeterLabel = {
		render:game.library.defaultWidgets.showText,
		xPos : 200, yPos:150,
		textSize: (1/30),
		font: "monospace",
		textAlign: "right",
		textBaseline: "bottom",
		getText: function() {return "fuel"}
	};
	
	game.widgets.push(descentMeter,fuelMeter,fuelMeterLabel);
	
	var ourLevels = {		
	moonbaseAlpha: {name: "moonbase alpha", width:1000, height:2500,
		items:[
			{func:"landingCraft", spec:{x:200,y:1350,h:0.0*Math.PI, mass: 50,
			v:0,radius:20,elasticity:0.25,thrust:0.1, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}
			, isPlayer:true},		
			{func:'landingCraft', spec:{x:800,y:1350,h:0,thrust:0.45,v:0, mass:50,radius:20,color:'white'}},
			{func:"boulder", spec:{x:500,y:4950,radius:2550, pattern:"stone.jpg"}},
			{func:"landingZone", spec:{x:500,y:2400,width:300,height:50, isGoal:true,color:'green'}},
			{func:"boulder", spec:{x: 200, y:2450, radius:50, pattern: "stone.jpg"}},
			{func:"boulder", spec:{x: 350, y:2430, radius:60, pattern: "stone.jpg"}},
			],
		effects:[],
		environment : {
			gravitationalConstant: 1,
			airDensity: 0.01,
			localGravity:0.1
		},
		background : {
			planetRadius: 2000,
			atmosphereDepth: 800,
			atmosphereColor: '150,140,255'
		},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.timePlayerOn > 20)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	},
	moonbaseBeta: {name: "moonbase beta", width:1000, height:2500,
		items:[
			{func:"landingCraft", spec:{x:500,y:1300,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.5,thrust:0.15, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}},isPlayer:true},		
			{func:"boulder", spec:{x:500,y:4950,radius:2550, pattern:"soil.jpg"}},
			{func:"ground", spec:{x:0,y:2500-350,width:200,height:300, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:200,y:2500-350,width:150,height:50, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:800,y:2500-650,width:200,height:600, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:800,y:2500-80,radius:100, pattern:"soil.jpg"}},
			{func:"landingZone", spec:{x:300,y:2500-100,width:300,height:50, isGoal:true,color:'green'}},
			{func:"landingZone", spec:{x:50,y:2500-360,width:50,height:10, isRefuel:true,color:'red'}}
			],
		effects:[],
		backgroundStars:{
			number:500
		},			
		environment : {
			gravitationalConstant: 1,
			airDensity: 0.005,
			localGravity:.12
		},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.timePlayerOn > 20)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	},	
	slowdrop:	{name: "slow drop in thick atmo", width:1000, height:2500,
			items:[
				{func:"landingCraft", spec:{x:150,y:2500-1200,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.25,thrust:0, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:'landingCraft', spec:{x:800,y:1950,h:1,v:0, mass:50,radius:20,color:'white'}},
				{func:"ground", spec:{x:0,y:2450,width:1000,height:50, pattern:"soil.jpg"}},
				{func:"landingZone", spec:{x:500,y:2400,width:300,height:50, isGoal:true,color:'green'}},
				],
			effects:[],
			environment : {
				gravitationalConstant: 1,
				airDensity: 0.15,
				localGravity:.13
			},
			background : {
				planetRadius: 2000,
				atmosphereDepth: 1000,
				atmosphereColor: '150,40,160'
			},
			victoryCondition: function () {
				return (game.session.items.filter(function(item){return(item.isGoal && item.playerHasLanded)}).length > 0);
			},
			failureCondition: function() {
				return game.session.player.stuck;
			}
		}	
	};

	game.level = [
		ourLevels.slowdrop,
		ourLevels.moonbaseAlpha,
		ourLevels.moonbaseBeta
	];

	game.reactToControls = function(buttonsPressed){
		
		var control = {
			left: (this.keyMap["ArrowLeft"] || buttonsPressed.indexOf('left')>-1 || this.swipeDirection.x==-1),
			right: (this.keyMap["ArrowRight"] || buttonsPressed.indexOf('right')>-1 || this.swipeDirection.x==1),
			up: (this.keyMap["ArrowUp"] || buttonsPressed.indexOf('up')>-1|| this.swipeDirection.y==-1),
			down: (this.keyMap["ArrowDown"] || buttonsPressed.indexOf('down')>-1 || this.swipeDirection.y==1),
			fire: (this.keyMap[" "] || buttonsPressed.indexOf('fire')>-1)
		}
		
		
		var ship = this.session.player;
		if (control.left)  {ship.command("TURN_ANTICLOCKWISE")};
		if (control.right) {ship.command("TURN_CLOCKWISE")};
		if (control.fire) {ship.command("FIRE");this.keyMap[" "] = false;};			
		if (control.up) {ship.command("THRUST_INCREASE") };
		if (control.down) {ship.command("THRUST_DECREASE")};	
		
		if (this.keyMap["z"]) {ship.momentum.m = 0.0 };	
		if (this.keyMap["x"]) {ship.h = ship.momentum.h;};
		if (this.keyMap["c"]) {ship.h = game.calc.reverseHeading(ship.momentum.h);};		
	}
	
	game.renderLevelScreen = function (c,ctx,plotOffset) {
		ctx.beginPath();
		
		ctx.font = (c.clientWidth*1/10)+"px monospace";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline="top";
		ctx.fillText(
			'level ' + (this.session.currentLevel+1),
			c.width*1/2, c.height*1/4
		);
		ctx.font = (c.clientWidth*1/20) + "px monospace";
		ctx.textAlign = "left";
		ctx.fillText(
			this.level[this.session.currentLevel].name, 
			c.width*1/3, c.height*8/16
		);
		ctx.fillText(
			"gravity: " + game.session.environment.localGravity, 
			c.width*1/3, c.height*9/16
		);
		ctx.fillText(
			"atmosphere: " + game.session.environment.airDensity, 
			c.width*1/3, c.height*10/16
		);
	};
	
	game.customNewLevelAction = function(level) {
		game.library.backgroundStars.defineStars(level);
	};

	game.renderBackground = function(c,ctx,plotOffset) {
		var level = game.level[game.session.currentLevel];
		game.library.backgroundStars.plotStars(c,ctx,plotOffset);
		
		if (level.background) {
			if (level.background.atmosphereDepth) {
				var planetRadius = level.background.planetRadius || 2500;
				
				var atmo = {
					depth:level.background.atmosphereDepth,
					x: level.width*1/2-plotOffset.x,
					y: level.height+planetRadius-plotOffset.y,
					color: level.background.atmosphereColor ||'100,100,220'
				};
				
				var gradient = ctx.createRadialGradient(atmo.x,atmo.y,planetRadius, atmo.x,atmo.y,planetRadius+atmo.depth);
				gradient.addColorStop(0.4,'rgba('+ atmo.color +',1)');
				gradient.addColorStop(1, 'rgba('+ atmo.color +',0)');
				
				ctx.beginPath();
				ctx.fillStyle = gradient;
				ctx.arc(atmo.x,atmo.y,planetRadius+atmo.depth,0,Math.PI*2);
				ctx.fill();
			}
		}
		
	}; 
	
	
	game.make.ground = function(spec){
		var that=game.make.item(spec);
		that.type='ground';	
		return that;
	}

	game.make.boulder = function(spec){
		var that=game.make.roundItem(spec);
		that.type='ground';	
		return that;
	}
	
	game.make.landingZone = function(spec){
		var that = game.make.ground(spec);
		that.type='ground';
		that.isGoal =  spec.isGoal || false;
		that.isRefuel =  spec.isRefuel || false;
		that.playerHasLanded = false;
		that.timePlayerOn = 0;
		
		that.checkIfPlayerLanded = function () {
			var player = game.session.player;
			
			this.playerHasLanded = (this.top - player.bottom < 1 && player.x > this.left 
				&& player.x < this.right
				&& player.momentum.m < 1) ;
			if (this.playerHasLanded) {
				this.timePlayerOn++;
				if (this.isRefuel && typeof player.refuel === 'function') {player.refuel(1)}
			} else {this.timePlayerOn = 0};
		};
		
		that.automaticActions.push (that.checkIfPlayerLanded); 		
		return that;
	
	}
				
	game.make.landingCraft = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = 'ship';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);
		
		that.fuel = spec.fuel || 200;
		that.fuelCapacity = spec.fuelCapacity || 200;
		that.timeStranded = 0;
		that.stuck = false;
		that.resiliance = spec.resiliance || 150;
		
		var burnFuel = function() {
			if (this.thrust){
				this.fuel -=this.thrust;
				if (this.fuel<0) {this.fuel = 0; this.thrust = 0};
			};
		}
		
		refuel = function (amount) {
			this.fuel = Math.min (this.fuel + amount, this.fuelCapacity);
		};
		that.refuel = refuel;
		
		var checkIfStuck = function () {
			if (this.fuel === 0 && this.momentum.m < 0.2 ) {
				if (this.timeStranded++ > 10) {
					that.stuck = true;
				}
			} else { this.timeStranded = 0;} 
		}
		
		that.automaticActions.push(VP.airResistForce, VP.thrustForce,VP.globalGravityForce,burnFuel,checkIfStuck)
		
		that.explode = function() {
			game.sound.play("die.mp3");
			game.session.effect.push(game.makeEffect.expandingRing({x:this.x, y:this.y, lastFrame:20}));
			this.dead = true;
		};
		
		that.hit.ground = function(impactPoint,isReversed) {
			
			if (this ==  game.session.player){
				//reportImpact(impactPoint,isReversed);
				//game.session.paused = true;
			}
			if (impactPoint.force > this.resiliance) {
				this.explode();
			}
			VP.reflectForceOffFlatSurface(impactPoint,isReversed);
		}
		
		that.command = function(commandName, commandOptions){
			switch (commandName) {			
			case "THRUST_INCREASE":
				if (this.fuel){this.thrust += 0.025} 
				break;
			case "THRUST_DECREASE":
				this.thrust -= 0.025 
				break;
			case "TURN_ANTICLOCKWISE":
				this.h -= 0.02 * Math.PI;
				break;
			case "TURN_CLOCKWISE":
				this.h += 0.02 * Math.PI;
				break;
			};
		};
		
		that.draw = function() {
			var flickerY1 = (Math.random())/2;
			var flickerY2 = (Math.random())/2;
			var flickerX1 = (Math.random()-0.5)/3;
			var flickerX2 = (Math.random()-0.5)/3;
			
			var flameSize = 0.5+this.thrust*3;
			
			var drawFlames =  this.thrust ? [
				{com:'beginPath'},
				{com:'moveTo',x:-0.7,y:1},
				{com:'quadraticCurveTo',x:-0.3,y:1,controlPoint:{y:1+flickerY1+flameSize,x:-0.5+flickerX1}},
				{com:'fillStyle', colors:[{v:0, color:'white'},{v:0.3, color:'yellow'},{v:0.75, color:'red'}], start:0.1, end:1+flameSize+flickerY1 },				
				{com:'fill'},	
				
				{com:'beginPath'},
				{com:'moveTo',x:0.3,y:1},
				{com:'quadraticCurveTo',x:0.7,y:1,controlPoint:{y:1+flickerY2+flameSize,x:0.5+flickerX2}},
				{com:'fillStyle', colors:[{v:0, color:'white'},{v:0.3, color:'yellow'},{v:0.75, color:'red'}], start:0.1, end:1+flameSize+flickerY2 },				
				{com:'fill'}]	
			: [];
			
			var drawBody = [
				{com:'beginPath'},
				{com:'arc', x:0,y:0,r:1,startAngle:0.9, endAngle:0.1},
				{com:'closePath'},
				{com:'fillStyle',v:this.color},
				{com:'fill'}			
			];
			
			var drawCockpit = [
				{com:'beginPath'},
				{com:'arc', x:0,y:-0.2,r:0.5,startAngle:1, endAngle:0},
				{com:'closePath'},
				{com:'fillStyle', v:'black'},
				{com:'fill'},			
			];
			
			var drawThrusters = [			
				{com:'beginPath'},
				{com:'strokeStyle', v:this.color},
				{com:'fillStyle', v:'gray'},
				{com:'moveTo', x:-0.7 ,y:0.3 },
				{com:'lineTo', x:-0.3 ,y:0.3 },
				{com:'lineTo', x:-0.3 ,y:1 },
				{com:'lineTo', x:-0.7 ,y:1 },
				{com:'closePath'},
				{com:'stroke'},
				{com:'fill'},

				{com:'beginPath'},
				{com:'strokeStyle', v:this.color},
				{com:'fillStyle', v:'gray'},
				{com:'moveTo', x:0.7 ,y:0.3 },
				{com:'lineTo', x:0.3 ,y:0.3 },
				{com:'lineTo', x:0.3 ,y:1 },
				{com:'lineTo', x:0.7 ,y:1 },
				{com:'closePath'},
				{com:'stroke'},
				{com:'fill'},
			];
			
			return [].concat (drawFlames, drawBody, drawCockpit, drawThrusters);
		};
		
		return that;
	};	
		
	return game;
};