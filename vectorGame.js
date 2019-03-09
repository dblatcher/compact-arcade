
function vectorGame(game) {
		
	var VP = game.library.vectorPhysics;
	VP.environment.gravitationalConstant = 0.1;
	VP.environment.airDensity = 0.0;
	
	
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
		
	var thrustmeter = {
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
	game.widgets.push(thrustmeter,mapWidget);
	
	
	game.level = [
		{width:1000, height:1000,
			items :[
				{func:"fancyShip", spec:{x:150,y:600,h:0.0*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				//{func:'rock', spec:{x:500,y:400,h:0,v:0,radius:70, mass:50,color:'blue',momentum:{h:(Math.PI*0.5), m:0} }},
			//	{func:'blackHole', spec:{x:600,y:600,h:0,v:0,radius:50, mass:5000, gravityMaxRange:300,color:'purple' }},
			//	{func:'rock', spec:{x:100,y:700,h:0,v:0,radius:25, mass:50,color:'red', momentum:{h:(Math.PI*1.5), m:4} },isPlayer:false},
				{func:'rock', spec:{x:200,y:250,h:0,v:0,radius:90,density:2,color:'blue', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:'rock', spec:{x:400,y:250,h:0,v:0,radius:90,density:1,color:'green', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
			//	{func:'solidRock', spec:{x:300,y:150,h:0,v:0,radius:30, mass:20,color:'white', momentum:{h:(Math.PI*1.5), m:1} },isPlayer:false},
			//	{func:"ground", spec:{x:0,y:950,width:1000,height:50}},
			//	{func:"ground", spec:{x:100,y:700,width:40,height:250}},
			],
			effects : [
			],
			victoryCondition : function() {
				return (game.session.items.filter(function(item){return(item.type==='rock')}).length === 0);
			}
		},
		{width:1200, height:1200,
			items :[
			
				{func:"fancyShip", spec:{x:150,y:1100,h:0.0*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:'blackHole', spec:{x:500,y:500,h:0,v:0,radius:10, mass:2500, gravityMaxRange:250,color:'purple' }},
				{func:'solidRock', spec:{x:200,y:250,h:0,v:0,radius:90, mass:60,color:'red', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
			
				{func:'solidRock', spec:{x:800,y:950,h:0,v:0,radius:40, mass:20,color:'red', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:'solidRock', spec:{x:200,y:950,h:0,v:0,radius:40, mass:20,color:'red', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
				{func:'solidRock', spec:{x:700,y:150,h:0,v:0,radius:40, mass:20,color:'red', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
			
				{func:"ground", spec:{x:0,y:1150,width:1200,height:50}},
				{func:"ground", spec:{x:0,y:0,width:1200,height:50}},
				{func:"ground", spec:{x:0,y:0,width:50,height:1200}},
				{func:"ground", spec:{x:1150,y:0,width:50,height:1200}},
			
			],
			effects : [
			],
			victoryCondition : function() {
				return (game.session.items.filter(function(item){return(item.type==='solidRock')}).length === 0);
			}
		}
		
	];

	game.reactToControls = function(){
			var ship = this.session.player;
			if (this.keyMap["ArrowLeft"])  {ship.h -= 0.025 * Math.PI;};
			if (this.keyMap["ArrowRight"]) {ship.h += 0.025 * Math.PI;};
			if (this.keyMap["ArrowUp"]) {ship.thrust += 0.03 };
			if (this.keyMap["ArrowDown"]) {ship.thrust -= 0.06 };	
			if (this.keyMap["z"]) {ship.momentum.m = 0.0 };	
			if (this.keyMap["x"]) {ship.h = ship.momentum.h;};
			if (this.keyMap["c"]) {ship.h = game.calc.reverseHeading(ship.momentum.h);};		
			if (this.keyMap[" "]) {		
				ship.launchProjectile();
				this.keyMap[" "] = false;
			};			
		}
	
	game.make.ground = function(spec){
		var that=game.make.item(spec);
		that.type='ground';	
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
				
		that.hit.rock = function(impactPoint,isReversed){
			VP.flatBounce(impactPoint,isReversed);	
			game.session.effect.push(game.makeEffect.expandingRing({x:impactPoint.x, y:impactPoint.y, lastFrame:20}));
			this.dead = true;
		};
		that.hit.solidRock = that.hit.rock;
		
		that.hit.ground = game.library.vectorPhysics.reflectForceOffFlatSurface;
		that.hit.blackHole = getSuckedIn;
		
		that.draw = function(){
			var flicker1 = (Math.random()-0.5)/20;
			var flicker2 = (Math.random())/5;
			var flameSize = 0.5+(10*this.thrust)*0.8;
						
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
				color:'red',
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

			var shardVector2 = game.calc.vectorFromForces([this.momentum, {h:game.calc.reverseHeading(randomHeading),m:randomSpeed}],3);
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
		that.automaticActions.push(VP.airResistForce,VP.exertGravity,function(){this.h +=this.spin;});
		
		
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