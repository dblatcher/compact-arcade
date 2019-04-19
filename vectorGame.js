

function vectorGame(game, options) {
		
	var VP = game.library.vectorPhysics;
	game.soundFiles.push ('laser.mp3','die.mp3');
	game.spriteFiles.push ('stone.jpg');
	
	var reportImpact = function(impactPoint,isReversed) {
		if (isReversed) return false;
		
		var message = 'T:' + game.cycleCount + ', ' + impactPoint.item1.type + ' delivered a ' + impactPoint.force+ 'n force';
		message += ' on a ' + impactPoint.item2.color + ' ' + impactPoint.item2.type; 
		console.log(message);
	};
	
	var stopDead = function(impactPoint, isReversed){
		if (isReversed) {return false};
		
		console.log(impactPoint);
		
		this.x=impactPoint.stopPoint.x;
		this.y=impactPoint.stopPoint.y;
		this.thrust = 0;
		this.momentum.m = 0;
		this.queuedMove = {x:0,y:0,m:0,h:0};
		game.session.effect.push(
			game.makeEffect.expandingRing({x:impactPoint.x, y:impactPoint.y, lastFrame:20})
		);			
	}
	
	var getSuckedIn = function(impactPoint, isReversed){
		if (isReversed) {return false;}
		var hole, otherItem;	
		if (impactPoint.item1.type == "blackHole") {
			hole = impactPoint.item1;
			otherItem = impactPoint.item2;
		}
		if (impactPoint.item2.type == "blackHole") {
			hole = impactPoint.item2;
			otherItem = impactPoint.item1;
		}
		if (!hole) {return false;}
		
		otherItem.dead = true;
		hole.mass += otherItem.mass;		
	};

	var breakRock = function(impactPoint,isReversed){
		var shatterUntilTooSmall = function(item){
			if (item.dead) {return false}
			if (item.radius > 40) {
				item.shatter();
			} else {
				item.dead = true;
			}
		};
		
		game.session.effect.push(game.makeEffect.expandingRing({x:impactPoint.x, y:impactPoint.y, lastFrame:20}));
		if (impactPoint.item2.type == "rock") {shatterUntilTooSmall(impactPoint.item2);}
		if (impactPoint.item1.type == "rock") {shatterUntilTooSmall(impactPoint.item1);}
		this.dead = true;		
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
			if (value < 0.75) {green = 255; red = 0}
			else if (value > 2) {green = 0; red = 255}
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
	
	var thrustMeter = {
		render:game.library.defaultWidgets.circleChart,
		xPos : 160, yPos:50, height:100,width:20,margin:1,
		chartFill:"rgba(200, 200, 200, 0.3)",
		barFill:function(barLevel,ctx){
			var grd = ctx.createRadialGradient(
			this.xPos+this.height/2,this.yPos+this.height/2,
			1,
			this.xPos+this.height/2,this.yPos+this.height/2,
			barLevel
			);
			grd.addColorStop(0,'white');
			grd.addColorStop(0.4,'yellow');
			grd.addColorStop(0.8,'red');
			return grd;
		},
		getValue: function(){return game.session.player.thrust},
		getRange: function(){return 1},
	}
	var mapWidget = function(c,ctx,plotOffset) {
		ctx.beginPath();
		ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
		ctx.rect(50,50,100,100);
		ctx.fill();
		var X,Y,size;
		
		for(var i = 0; i<game.session.items.length; i++) {
			X = 100*(game.session.items[i].x / game.level[game.session.currentLevel].width);
			Y = 50*(game.session.items[i].y / game.level[game.session.currentLevel].height);
			
			size = (game.session.items[i] === game.session.player) ? 6:4;			
			
			ctx.beginPath();
			ctx.fillStyle = game.session.items[i].color;
			ctx.rect(50+X-size/2,50+Y-size/2,size,size);
			ctx.fill();
		}
		
		
	};
	

	function slowDown_AI() {
		var headingToSlowDown = game.calc.normaliseHeading(game.calc.reverseHeading(this.momentum.h));
		var headingNow = game.calc.normaliseHeading(this.h);				
		var turnNeeded = headingToSlowDown - headingNow;
		if (turnNeeded < -Math.PI) (turnNeeded += (Math.PI*2));
		if (turnNeeded > Math.PI) (turnNeeded -= (Math.PI*2));
			
		if (this.momentum.m > 0.5) {
			if (turnNeeded > -0.01) {this.command("TURN_CLOCKWISE");}
			if (turnNeeded <  0.01) {this.command("TURN_ANTICLOCKWISE");}	
		}
		
		if ( Math.abs(turnNeeded) > 0.3 ) {
			this.command("THRUST_DECREASE");
		} else {
			if (this.thrust < 0.5 && this.momentum.m > 0) {this.command("THRUST_INCREASE")}
		}
		
	};
	
	function attack_AI(){
		var target = game.session.player;
		var headingToAttack = game.calc.headingFromVector(-(this.x-target.x), this.y - target.y);
		var headingNow = game.calc.normaliseHeading(this.h);				
		var turnNeeded = headingToAttack - headingNow;
		if (turnNeeded < -Math.PI) (turnNeeded += (Math.PI*2));
		if (turnNeeded > Math.PI) (turnNeeded -= (Math.PI*2));
		if (turnNeeded > -0.025 * Math.PI) {this.command("TURN_CLOCKWISE");}
		if (turnNeeded <  0.025 * Math.PI) {this.command("TURN_ANTICLOCKWISE");}	
		
		var distanceToTarget = game.calc.distance(this, target);
		
		if (distanceToTarget > 200 && this.thrust <0.05 && Math.abs(turnNeeded) < 0.5) {
			this.command("THRUST_INCREASE")
		} 
		
		if ( Math.abs(turnNeeded) < 0.05 && distanceToTarget<300) {
			this.command("FIRE");		
		};
	}
	
	function findThreatsTo(ship){
		var threats = [], item, riskLevel, collideChance;
		
		for (var i = 0; i < game.session.items.length; i++) {
			item = game.session.items[i];
			if (item === ship){continue;}
			if (item.type !== "missile" && item.type !== "rock" && item.type !== "solidRock") {continue}
			riskLevel = determineRisk(item);
			collideChance = determineCollideChance(item);
			
			if (riskLevel || collideChance) {
				threats.push({item:item,risk:riskLevel, coliding:collideChance});
			}
		}
		threats.sort(function(a,b) {return Math.max(b.risk, b.collideChance) - Math.max(a.risk, a.collideChance) });
		return threats;
		
		function determineRisk(item){
			var bearing = game.calc.headingFromVector(-(item.x-ship.x), item.y - ship.y);
			var course = game.calc.normaliseHeading(item.momentum.h);				
			var turnNeeded = bearing - course;
			if (turnNeeded < -Math.PI) (turnNeeded += (Math.PI*2));
			if (turnNeeded > Math.PI) (turnNeeded -= (Math.PI*2));
			
			var coliding;
			if (Math.abs(turnNeeded) > Math.PI/2 ) {coliding = 0} else {
				coliding = (Math.PI/2 - Math.abs(turnNeeded)) / (Math.PI/2);
			}
			
			var distance = game.calc.distance (item,ship);
			var speed = item.momentum.m;
			
			var danger = 100;
			if (item.type === "missile") {danger = 10}
			return danger * speed * coliding * coliding / distance;
		}
		
		function determineCollideChance (item) {
			var bearing = game.calc.headingFromVector(-(ship.x-item.x), ship.y - item.y);
			var course = game.calc.normaliseHeading(ship.momentum.h);
			var divergence = bearing - course;
			if (divergence < -Math.PI) (divergence += (Math.PI*2));
			if (divergence > Math.PI) (divergence -= (Math.PI*2));
			
			var distance = game.calc.distance (item,ship);
			var coliding;
			if (Math.abs(divergence) > Math.PI/2 ) {coliding = 0} else {
				
				var directPathVector = game.calc.vectorFromForces([{m:distance,h:bearing}]);
				var actualPathVector = game.calc.vectorFromForces([{m:distance,h:course}]);
				
				var divergenceDistance = game.calc.distance(
					{x: ship.x + directPathVector.x, y:ship.y - directPathVector.y},
					{x: ship.x + actualPathVector.x, y:ship.y - actualPathVector.y}
				)
				
				if (divergenceDistance < item.radius + ship.radius) {
					coliding = 1
				} else {
					coliding = 0;
				}
				var speed = ship.momentum.m;
			}
			
			var danger = 100;
			if (item.type === "missile") {danger = 10}
			return danger * speed * coliding * coliding / distance;
		}
	}
	
	function evadeThreat_AI() {
		var threats = findThreatsTo(this);
		
		if (threats.length>0) {			
			//console.log (threats[0].item.color + ' '+threats[0].item.type, threats[0].risk)
			
			if (threats[0].risk > 0.1){
				
				var escapeCourse1 = game.calc.normaliseHeading(threats[0].item.momentum.h + Math.PI/2);
				var turnNeeded1 = escapeCourse1 - this.h;
				if (turnNeeded1 < -Math.PI) (turnNeeded1 += (Math.PI*2));
				if (turnNeeded1 > Math.PI) (turnNeeded1 -= (Math.PI*2));
				
				var escapeCourse2 = game.calc.normaliseHeading(threats[0].item.momentum.h - Math.PI/2);
				var turnNeeded2 = escapeCourse2 - this.h;
				if (turnNeeded2 < -Math.PI) (turnNeeded2 += (Math.PI*2));
				if (turnNeeded2 > Math.PI) (turnNeeded2 -= (Math.PI*2));	
				
				var turn = Math.abs(turnNeeded1) < Math.abs(turnNeeded2) ? turnNeeded1 : turnNeeded2;
				
				if (Math.abs(turn) > 0 ) {
					if ( turn < 0 ){this.command("TURN_ANTICLOCKWISE")} else {this.command("TURN_CLOCKWISE")}
				}
				
				if (this.thrust <0.1 && Math.abs(turn) < 0.5) {
					this.command("THRUST_INCREASE")
				} 
				
			} 
		
			if (threats[0].coliding > 0 ) {
		
				var escapeCourse1 = game.calc.normaliseHeading(this.momentum.h + Math.PI/2);
				var turnNeeded1 = escapeCourse1 - this.h;
				if (turnNeeded1 < -Math.PI) (turnNeeded1 += (Math.PI*2));
				if (turnNeeded1 > Math.PI) (turnNeeded1 -= (Math.PI*2));
				
				var escapeCourse2 = game.calc.normaliseHeading(this.momentum.h - Math.PI/2);
				var turnNeeded2 = escapeCourse2 - this.h;
				if (turnNeeded2 < -Math.PI) (turnNeeded2 += (Math.PI*2));
				if (turnNeeded2 > Math.PI) (turnNeeded2 -= (Math.PI*2));	
				
				var turn = Math.abs(turnNeeded1) < Math.abs(turnNeeded2) ? turnNeeded1 : turnNeeded2;
				
				if (Math.abs(turn) > 0 ) {
					if ( turn < 0 ){this.command("TURN_ANTICLOCKWISE")} else {this.command("TURN_CLOCKWISE")}
				}
				
				if (this.thrust <0.1 && Math.abs(turn) < 0.5) {
					this.command("THRUST_INCREASE")
				}
		
		
			}
					
		} else {
			slowDown_AI.apply(this,[])
		};
		
	}
	

	var ourLevels = {		
	moonbaseAlpha: {name: "moonbase alpha", width:1000, height:2500,
		items:[
			{func:"landingCraft", spec:{x:600,y:2350,h:0.0*Math.PI, mass: 50,
			v:0,radius:20,elasticity:0.25,thrust:0.1, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}
			, isPlayer:true},		
			{func:'landingCraft', spec:{x:800,y:1350,h:0,thrust:0.45,v:0, mass:50,radius:20,color:'white'}},
			{func:"boulder", spec:{x:500,y:4950,radius:2550, pattern:"stone.jpg"}},
			{func:"landingZone", spec:{x:500,y:2400,width:300,height:50, isGoal:true,color:'green'}},
			{func:"boulder", spec:{x: 200, y:2450, radius:50, pattern: "stone.jpg"}},
			{func:"boulder", spec:{x: 350, y:2430, radius:60, pattern: "stone.jpg"}},
			],
		effects:[],
		removeWidgets: [thrustMeter,mapWidget],
		addWidgets:[descentMeter,fuelMeter,fuelMeterLabel],
		environment : {
			gravitationalConstant: 0.1,
			airDensity: 0.01,
			localGravity:1
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
	moonbaseBeta: {name: "moonbase beta", width:1000, height:1500,
		items:[
			{func:"landingCraft", spec:{x:500,y:1300,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.5,thrust:0.15, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}},isPlayer:true},		
			{func:"boulder", spec:{x:500,y:3950,radius:2550, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:0,y:1500-350,width:200,height:300, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:200,y:1500-350,width:150,height:50, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:800,y:1500-650,width:200,height:600, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:800,y:1500-80,radius:100, pattern:"stone.jpg"}},
			{func:"landingZone", spec:{x:300,y:1400,width:300,height:50, isGoal:true,color:'green'}},
			{func:"landingZone", spec:{x:50,y:1500-360,width:50,height:10, isRefuel:true,color:'red'}}
			],
		effects:[],
		backgroundStars:{
			number:500
		},			
		environment : {
			gravitationalConstant: 0.1,
			airDensity: 0.005,
			localGravity:1.2
		},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.timePlayerOn > 20)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	},	
	slowdrop:	{name: "slow drop in thick atmo", width:1000, height:1500,
			items:[
				{func:"landingCraft", spec:{x:150,y:300,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.25,thrust:0, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:'landingCraft', spec:{x:800,y:950,h:1,v:0, mass:50,radius:20,color:'white'}},
				{func:"ground", spec:{x:0,y:1450,width:1000,height:50, pattern:"stone.jpg"}},
				{func:"landingZone", spec:{x:500,y:1400,width:300,height:50, isGoal:true,color:'green'}},
				],
			effects:[],
			environment : {
				gravitationalConstant: 0.1,
				airDensity: 0.15,
				localGravity:1.3
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
		},	
	asteroidBelt:	{name: "asteroid belt", width:1000, height:1000,
			items :[
				{func:"fancyShip", spec:{x:150,y:600,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},		
				{func:'rock', spec:{x:200,y:250,h:0,v:0,radius:90,density:2,color:'blue', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:"ship", spec:{x:850,y:600,h:0.2*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0.2,color:'purple', behaviour:slowDown_AI,momentum:{h:(Math.PI*1), m:6}}},		
				{func:"ship", spec:{x:650,y:900,h:0.2*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'yellow', behaviour:evadeThreat_AI,momentum:{h:(Math.PI*1), m:0}}}
			],
			effects : [],
			environment :{
				gravitationalConstant:0.1,
				airDensity: 0,
				localGravity: 0
			},
			removeWidgets:[descentMeter,fuelMeter,fuelMeterLabel],
			addWidgets:[thrustMeter,mapWidget],
			victoryCondition : function() {
				return (game.session.items.filter(function(item){return(item.type==='rock')}).length === 0);
			}
		},
	planetPool:	{name: "planet pool", width:1200, height:1200,
			items :[
				{func:"fancyShip", spec:{x:150,y:1100,h:0.0*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:'blackHole', spec:{x:500,y:500,h:0,v:0,radius:10, mass:2500, gravityMaxRange:250,color:'purple' }},
			
				{func:'solidRock', spec:{x:200,y:250,h:0,v:0,radius:90, mass:60,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:'solidRock', spec:{x:200,y:950,h:0,v:0,radius:40, mass:20,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:'solidRock', spec:{x:700,y:150,h:0,v:0,radius:40, mass:20,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
			
				{func:"ground", spec:{x:0,y:0,width:1200,height:50}},
				{func:"ground", spec:{x:0,y:0,width:50,height:1200}},
				{func:"ground", spec:{x:1150,y:0,width:50,height:1200}},
			
			],
			effects : [
			],
			victoryCondition : function() {
				return (game.session.items.filter(function(item){return(item.type==='solidRock')}).length === 0);
			}
		},
	spaceDuel:	{name: "space duel", width:1000, height: 1000,
			items: [
				{func:"fancyShip", spec:{x:150,y:600,h:0.0*Math.PI, mass: 50, v:0,radius:20,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},		
				{func:"ship", spec:{x:850,y:600,h:0.2*Math.PI,v:0,radius:20,shield:0.5,thrust:0.2,color:'green', behaviour:attack_AI,momentum:{h:(Math.PI*1), m:6}}},		
			],
			effects : [],
			addWidgets: [thrustMeter,mapWidget],
			removeWidgets:[descentMeter,fuelMeter,fuelMeterLabel],
			environment : {
				gravitationalConstant: 0.1,
				airDensity: 0.0,
				localGravity:0
			},
			victoryCondition : function(){
				var test = function(item){
					return ((item.type==='ship') && (item.color === 'green'));
				}
				var filtered = game.session.items.filter(test);
				return filtered.length === 0;
			}
		},
	};

	game.level = [
		ourLevels.moonbaseAlpha,
		ourLevels.moonbaseBeta
	];

	game.reactToControls = function(buttonsPressed){
		
		var control = {
			left: (this.keyMap["ArrowLeft"] || this.swipeDirection.x==-1),
			right: (this.keyMap["ArrowRight"] || this.swipeDirection.x==1),
			up: (this.keyMap["ArrowUp"] || this.swipeDirection.y==-1),
			down: (this.keyMap["ArrowDown"] || this.swipeDirection.y==1),
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
	
	game.make.bullet = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = 'missile';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);
		
		that.radius = 10;
		that.mass = spec.mass || 1;
		that.lifeSpan = spec.lifeSpan || -1;
		
		
		that.automaticActions.push(function() {
			this.h = this.momentum.h;
			if (this.lifeSpan-- == 0 ) {this.dead = true};
		});
		
		that.hit.ground = function(impactPoint,isReversed){
			VP.reflectForceOffFlatSurface(impactPoint,isReversed);
		}
		that.hit.blackHole = getSuckedIn;
		that.hit.ship = function(impactPoint,isReversed){	
			VP.flatBounce(impactPoint,isReversed);
			this.dead = true;
		};
		that.hit.solidRock = function(impactPoint,isReversed){	
			VP.mutualRoundBounce(impactPoint,isReversed);
			this.dead = true;
		};
		that.hit.rock = breakRock;
		
		return that;
	}
	
	game.make.ship = function (spec) {
		var that = game.make.roundItem(spec);
		that.type = 'ship';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);
		
		that.maxSpeed = spec.maxSpeed || 20;
		that.shield = spec.shield || 0;
		that.coolDownLevel = 0;
		that.coolDownDelay = 15;

		var coolDown = function(){
			if (this.coolDownLevel){this.coolDownLevel--};
		};
		var dropThrust = function(){
			if (this.thrust){this.thrust -= Math.min(this.thrust,0.05)};
		}
		that.automaticActions.push(VP.airResistForce, VP.thrustForce,VP.globalGravityForce,coolDown,dropThrust);
		if (spec.behaviour){that.automaticActions.push(spec.behaviour)}
		
		that.explode = function() {
			game.sound.play("die.mp3");
			game.session.effect.push(game.makeEffect.expandingRing({x:this.x, y:this.y, lastFrame:20}));
			this.dead = true;
		};
		
		that.hit.rock = function(impactPoint,isReversed){
			VP.flatBounce(impactPoint,isReversed);
			this.explode();
		};
		that.hit.solidRock = that.hit.rock;
		
		that.hit.ground = function(impactPoint,isReversed) {
			//reportImpact(impactPoint,isReversed);
			if (impactPoint.force > 150) {
				this.explode();
			}
			VP.reflectForceOffFlatSurface(impactPoint,isReversed);
		}
		
		that.hit.blackHole = getSuckedIn;
		
		that.command = function(commandName, commandOptions){
			switch (commandName) {
			case "FIRE":
				if(this.coolDownLevel === 0) {
					this.launchProjectile();
					game.sound.play("laser.mp3");
					this.coolDownLevel = this.coolDownDelay;
				}
				break;
			case "THRUST_INCREASE":
				this.thrust += 0.1 
				break;
			case "THRUST_DECREASE":
				this.thrust -= 0.05 
				break;
			case "TURN_ANTICLOCKWISE":
				this.h -= 0.025 * Math.PI;
				break;
			case "TURN_CLOCKWISE":
				this.h += 0.025 * Math.PI;
				break;
			};
		};
		
		that.drawShield = function(){
			if (!this.shield) {return [];}
			
			if (game.cycleCount%10 > this.shield*10) {return []}
		
			var draw = [
			{com:'beginPath'},
			{com:'fillStyle',v:'rgba(170,170,255,0.25)'},
			{com:"moveTo", h:0.5,d:1},
			{com:"arc", x:0,y:0,r:1.1 },			
			{com:'fill'}
			];
			
			
			
			return draw;
		}
		
		that.draw = function(){
			var flicker1 = (Math.random()-0.5)/20;
			var flicker2 = (Math.random())/5;
			var flameSize = 0.5+(10*this.thrust)*0.8;
			if (flameSize<0){flameSize = 0}			
			return [
				{com:'moveTo',x:-0.5,y:0.3},
				{com:'quadraticCurveTo',x:0.5,y:0.3,controlPoint:{h:1+flicker1,d:flameSize+flicker2}},
				{com:'fillStyle', colors:[{v:0, color:'blue'},{v:0.5, color:'white'},{v:1, color:'green'}], start:0.1, end:flameSize+flicker2 },				
				{com:'fill'},	
				{com:'beginPath'},	
				{com:'moveTo',h:0,d:1},
				{com:'lineTo',h:0.75,d:1},
				{com:'lineTo',h:1,d:0.5},
				{com:'lineTo',h:1.25,d:1},
				{com:'lineTo',h:0,d:1},
				{com:'fillStyle',v:this.color},
				{com:'fill'}
			].concat(this.drawShield());
		}
		
		
		var launchProjectile = function(makeFunction) {
			var projectileVector= game.calc.vectorFromForces([  {m:this.momentum.m, h:this.momentum.h} , {m:20,h:this.h}  ]);
			var projectileMomentum={
				m : Math.min(game.calc.distance(projectileVector),30),
				h : game.calc.headingFromVector(projectileVector)				
			};
			var projectileSpec = {
				x:this.x + (1.5*(this.radius+10)*projectileVector.x/projectileMomentum.m),
				y:this.y - (1.5*(this.radius+10)*projectileVector.y/projectileMomentum.m),
				h:(this.h/Math.PI),
				momentum:projectileMomentum,
				maxSpeed:30,
				radius:5,
				color:this.color,
				mass:4,
				lifeSpan:50
			};
			
			makeFunction = makeFunction || game.make.bullet;
			game.session.items.push( makeFunction(projectileSpec));
		}
		that.launchProjectile = launchProjectile;
				
		return that;
	}	
	
	game.make.fancyShip = function(spec) {
		var that = game.make.ship(spec);
		
		that.draw = function() {
			var flicker1 = (Math.random()-0.5)/20;
			var flicker2 = (Math.random())/5;
			var flameSize = 0.5+(this.thrust*10)*0.75;
			if (flameSize<0){flameSize = 0}	
			
			var drawFlames = this.thrust ? [
				{com:'moveTo',x:-0.5,y:0.3},
				{com:'quadraticCurveTo',x:0.5,y:0.3,controlPoint:{h:1+flicker1,d:flameSize+flicker2}},
				{com:'fillStyle', colors:[{v:0, color:'green'},{v:0.5, color:'white'},{v:1, color:'green'}], start:0.1, end:flameSize+flicker2 },				
				{com:'fill'}				
			] :	[];
			
			var drawBody = [
				{com:'beginPath'},
				{com:'moveTo', h:0.75, d:1},
				{com:'quadraticCurveTo',h:0.2 , d:1,controlPoint:{h:0.7,d:1}},
				{com:'quadraticCurveTo', h:0.1,d:0.3,controlPoint:{h:0,d:0.0}},
				{com:'lineTo', h:1.9,d:0.3},
				{com:'quadraticCurveTo', h:1.8,d:1,controlPoint:{h:0,d:0.0}},
				{com:'quadraticCurveTo',h:1.25 , d:1,controlPoint:{h:1.3,d:1}},
				{com:'lineTo', h:1.2,d:0.6},
				{com:'lineTo', h:0.8,d:0.6},
				{com:'lineTo', h:0.75,d:1},
				{com:'fillStyle',v:this.color}
			];
			
			var drawCockpit = [
				{com:'fill'},
				{com:'beginPath'},
				{com:'strokeStyle', v:"white"},
				{com:'moveTo', x:0, y:-0.1},
				{com:'lineTo', x:0.2,y:0.1},
				{com:'lineTo', x:-0.2,y:0.1},
				{com:'fillStyle',v:'black'},
				{com:'fill'},
				{com:'closePath'}
			];
			
			return [].concat(drawFlames, drawBody, drawCockpit);
		};
		
		return that;
	};
		
	game.make.landingCraft = function(spec) {
		var that = game.make.ship(spec);
		
		that.fuel = spec.fuel || 200;
		that.fuelCapacity = spec.fuelCapacity || 200;
		that.timeStranded = 0;
		that.stuck = false;
		
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
		
		that.automaticActions.pop(); // remove dropThrust
		that.automaticActions.push(burnFuel,checkIfStuck)
		
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
		
	game.make.rock = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = 'rock';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);

		// density will override mass if both set
		// not synced as properties - avoid changing mass or density of rocks
		if (typeof spec.density  === "number") {
			that.density = spec.density;
			that.mass = (spec.density*that.radius*that.radius*Math.PI)/1000;
		} else {
			that.density = 1000*that.mass / (that.radius*that.radius*Math.PI)
		}
		
		var vary = function(){return (Math.random()-0.5)/8 }
		that.spin = vary();
		
		that.shatter = function() {
			this.dead = true;
			var randomHeading = game.calc.round(Math.random()*2,3);
			var randomSpeed = game.calc.round(Math.random()*2,3);
			var shardVector1 = game.calc.vectorFromForces([this.momentum, {h:randomHeading,m:randomSpeed}],3);
			var shard1 = game.make.rock({
				x:this.x,
				y:this.y,
				radius:Math.floor(this.radius*0.7),
				density:this.density,
				color:this.color
			});
			shard1.queuedMove = {
				x:shardVector1.x,
				y:shardVector1.y,
				h:game.calc.headingFromVector(shardVector1.x,shardVector1.y),
				m:game.calc.distance(shardVector1)
			};		
			game.session.items.push( shard1 );

			var shardVector2 = game.calc.vectorFromForces([{h:game.calc.reverseHeading(randomHeading),m:randomSpeed}],3);
			var shard2 = game.make.rock({
				x:this.x,
				y:this.y,
				radius:Math.floor(this.radius*0.7),
				mass:this.mass/2.2,
				color:this.color
			})
			shard2.queuedMove = {
				x:shardVector2.x,
				y:shardVector2.y,
				h:game.calc.headingFromVector(shardVector2.x,shardVector2.y),
				m:game.calc.distance(shardVector2)
			};			
			game.session.items.push( shard2 );
			
		}
				
		that.hit.rock = VP.mutualRoundBounce;
		that.hit.solidRock = VP.mutualRoundBounce;
		that.hit.ground = VP.reflectForceOffFlatSurface;			
		that.hit.blackHole = getSuckedIn;
		that.automaticActions.push(VP.airResistForce,VP.exertGravity,VP.globalGravityForce,function(){this.h +=this.spin;});
		
		that.shape = [];
		for (var a = 0; a<1.9; a=a+0.1){
			that.shape.push({h:a+vary(), d:1 + vary()/2})
		}
		that.draw = function() {
			var list = [
			{com:'moveTo',h:this.shape[0].h,d:this.shape[0].d}
			];
			for (var i = 1; i < this.shape.length; i++){
				list.push(
					{com:'lineTo',h:this.shape[i].h,d:this.shape[i].d}
				);
			};
			list.push(
			{com:'lineTo',h:this.shape[0].h,d:this.shape[0].d},		
			{com:'fillStyle',v:this.color},
			{com:'fill'},
			{com:'closePath'}			
			)
			return list;
		}

		return that;
	};
	
	game.make.solidRock = function(spec) {
		var that = game.make.rock(spec);
		that.type = "solidRock";
		return that;
	}
	
	game.make.blackHole = function(spec) {
		
		var that = game.make.roundItem(spec);
		that.type = 'blackHole';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);		
		that.unmovedByGravity = true;
		that.automaticActions.push(VP.exertGravity);
		
		that.draw = function(){
			var orders = [];
			
			if (this.gravityMaxRange !== false) {
				var maxRingSize = this.gravityMaxRange/this.radius;
				var pulsePeriod = 25;
				var ringSize = maxRingSize - (maxRingSize-1)*(game.cycleCount%pulsePeriod)/pulsePeriod;
			} else {
				var ringSize = 1;
			};
			
			orders.push({ com:"strokeStyle", v:'black'})
			orders.push({ com:"moveTo", h:0.5,d:1})
			orders.push({ com:"arc", x:0,y:0,r:1,startAngle:0,endAngle:2 })
			orders.push({ com:"fillStyle", v:'black'})
			orders.push({ com:"fill"})
			orders.push({ com:"strokeStyle", v:this.color})
			orders.push({ com:"moveTo", h:0.5,d:ringSize})
			orders.push({ com:"arc", x:0,y:0,r:ringSize,startAngle:0,endAngle:2 })	
			
			return orders;
		};
		
		return that;
	};
	
	return game;
};