function vectorGame(game) {

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
	
	var airResistForce = function(){	
		if(!this.momentum.m) {return false}
		var F;
		var airDensity = 0.01;
		var dragCoef = 0.01;
		var area = this.radius * Math.PI;
				
		F = (airDensity * dragCoef * area / 2) * (this.momentum.m * this.momentum.m);
		F = Math.min(F,this.momentum.m)
		this.queuedForces.push({
			m:F,
			h:game.calc.reverseHeading(this.momentum.h)
		});
	};
	
	var globalGravityForce = function() {
		var G = 0.1;
		this.queuedForces.push({
			m:G,
			h:Math.PI*1
		});
	};


	game.level = [
		{width:1000, height:1000,
			items :[
			//	{func:"planet", spec:{x:200,y:800,radius:50,color:'white'}},
				{func:"fancyShip", spec:{x:500,y:40,h:0.0*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:"ground", spec:{x:0,y:950,width:1000,height:50}},
				{func:"ground", spec:{x:100,y:700,width:40,height:250}},
				{func:'ball', spec:{x:80,y:500,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*Math.random()*2), m:Math.random()*5} }},
			//	{func:'ball', spec:{x:850,y:220,h:0,v:0,radius:40, mass:100,color:'red', momentum:{h:(Math.PI*1.5), m:6} }},
				{func:'ball', spec:{x:200,y:700,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*Math.random()*2), m:Math.random()*5} }},
			//	{func:'ball', spec:{x:500,y:500,h:0,v:0,radius:100, mass:1000,color:'purple', momentum:{h:(Math.PI*0.5), m:2} }},
			// {func:'ball', spec:{x:800,y:500,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*1.5), m:2} }},
				{func:'ball', spec:{x:500,y:800,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*0), m:0} }},
			//	{func:'ball', spec:{x:800,y:400,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*0), m:5} }},
			//	{func:'ball', spec:{x:800,y:300,h:0,v:0,radius:50, mass:150,color:'blue',momentum:{h:(Math.PI*1.2), m:2} }},
			//	{func:'ball', spec:{x:800,y:300,h:0,v:0,radius:50, mass:550,color:'green',momentum:{h:(Math.PI*0.4), m:3} }},
			],
			effects : [
			],
			victoryCondition : function() {
				return false;
			}
		}
	];

	game.reactToControls = function(){
			var ship = this.session.player;
			if (this.keyMap["ArrowLeft"])  {ship.h -= 0.025 * Math.PI;};
			if (this.keyMap["ArrowRight"]) {ship.h += 0.025 * Math.PI;};
			if (this.keyMap["ArrowUp"]) {ship.thrust += 0.05 };
			if (this.keyMap["ArrowDown"]) {ship.thrust -= 0.1 };	
			if (this.keyMap["z"]) {ship.momentum.m = 0.0 };	
			if (this.keyMap["x"]) {ship.h = ship.momentum.h;};
			if (this.keyMap["c"]) {ship.h = game.calc.reverseHeading(ship.momentum.h);};		
			if (this.keyMap[" "]) {		
			//	ship.launchProjectile();
				this.keyMap[" "] = false;
			};			
			ship.thrust = Math.min(ship.thrust,10);
			ship.thrust = Math.max(ship.thrust,0);
		}
	
	game.make.ground = function(spec){
		var that=game.make.item(spec);
		that.type='ground';	
		return that;
	}
	
	game.make.ship = function (spec) {
		var that = game.make.roundItem(spec);
		that.type = 'ship';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);
				
		that.hit.ball = function(impactPoint,isReversed){
//			reportImpact(impactPoint,isReversed);
//			game.library.vectorPhysics.queRoundBounce(impactPoint,isReversed);	
		};
				
		that.automaticActions.push(airResistForce,globalGravityForce);
		//that.hit.planet = stopDead;
		that.hit.ground = game.library.vectorPhysics.reflectForceOffFlatSurface;
		
		that.draw = function(){
			var flicker1 = (Math.random()-0.5)/20;
			var flicker2 = (Math.random())/5;
			var flameSize = 0.5+this.thrust*0.8;
						
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
			];
		}
		
		return that;
	}
	
	game.make.fancyShip = function(spec) {
		var that = game.make.ship(spec);
		
		that.draw = function() {
			var flicker1 = (Math.random()-0.5)/20;
			var flicker2 = (Math.random())/5;
			var flameSize = 0.5+this.thrust*0.75;
						
			return [
				{com:'moveTo',x:-0.5,y:0.3},
				{com:'quadraticCurveTo',x:0.5,y:0.3,controlPoint:{h:1+flicker1,d:flameSize+flicker2}},
				{com:'fillStyle', colors:[{v:0, color:'green'},{v:0.5, color:'white'},{v:1, color:'green'}], start:0.1, end:flameSize+flicker2 },				
				{com:'fill'},	
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
				{com:'fillStyle',v:this.color},
				{com:'fill'},
				{com:'beginPath'},
				{com:'strokeStyle', v:"white"},
				{com:'moveTo', x:0, y:-0.1},
				{com:'lineTo', x:0.2,y:0.1},
				{com:'lineTo', x:-0.2,y:0.1},
				{com:'fillStyle',v:'black'},
				{com:'fill'},
				{com:'closePath'}
			]
		};
		
		return that;
	};
	
	game.make.ball = function(spec) {
		var that = game.make.roundItem(spec);
		that.type = 'ball';
		game.library.vectorGraphics.assignVectorRender(that,spec);
		game.library.vectorPhysics.assignVectorPhysics(that,spec);
				
		that.hit.ball = game.library.vectorPhysics.queRoundBounce;
		that.hit.ground = game.library.vectorPhysics.reflectForceOffFlatSurface;
		that.hit.ship = function(impactPoint,isReversed){
//			reportImpact(impactPoint,isReversed);
//			game.library.vectorPhysics.queRoundBounce(impactPoint,isReversed);	
		}
		
		that.hit.planet = function (impactPoint,isReversed) {
			
		};
				
		return that;
	};
	
	game.make.planet = function(spec) {
		var that = game.make.roundItem(spec);
		game.library.vectorGraphics.assignVectorRender(that,spec);
		
		that.mass = 100;
		that.type = 'planet';
		
		that.automaticActions.push(function(){
			this.h += 0.01;
			while(this.h > Math.PI*2) {this.h -= Math.PI*2};
		});	

		return that;
	};
	
	game.make.complex = function(spec) {
		var that = game.make.roundItem(spec);
		game.library.vectorGraphics.assignVectorRender(that,spec);
		
		that.automaticActions.push(function(){
			this.h += 0.01;
			while(this.h > Math.PI*2) {this.h -= Math.PI*2};
		});	
		
		that.draw = function() {
			return [
					{com:'moveTo',x:-1,y:-1},
					{com:'lineTo', x:0, y:-0.8},
					{com:'lineTo', x:1, y:-1},
					{com:'strokeStyle', v:"white"},
					{com:'lineTo', x:1, y:1},
					{com:'lineTo', x:-1, y:1},
					{com:'lineTo',x:-1,y:-1},
					{com:'moveTo',h:0,d:0},
					{com:'lineTo',h:0,d:0.5},
					{com:'strokeStyle', v:this.color},
					{com:'lineTo',h:0.2,d:0.5},
					{com:'lineTo',h:0.4,d:0.5},
					{com:'lineTo',h:0.6,d:0.5},
					{com:'lineTo',h:0.8,d:0.5},
					{com:'arc',h:0.8,d:0.5,r:0.5,startAngle:1.5-this.h,endAngle:0-this.h}
				];
		};
		return that;
	};
	
	
	return game;
};