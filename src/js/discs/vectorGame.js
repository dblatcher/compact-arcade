export function vectorGame(game, options) {

	var VP = game.library.vectorPhysics;

	game.soundFiles.push ('zap.mp3','die.mp3');
	game.spriteFiles.push ('stone.jpg');
	
	var reportImpact = function(impactPoint,isReversed) {
		var otherItem = impactPoint.item1 === this ? impactPoint.item2 : impactPoint.item1;
		
		var message = 'T:' + game.cycleCount + ', ' + this.type + ' delivered a ' + impactPoint.force+ 'n force';
		message += ' on a ' + otherItem.color + ' ' + otherItem.type;
		var message2 ='and the' + otherItem.type + ' delivered a ' + impactPoint.force2 + 'n force on that ' + this.type; 
		console.log(message,message2);
	};
	
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

	var lib = game.library.vectorGame;
	
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
		
		that.hit.ground = VP.reflectForceOffFlatSurface;
		
		that.hit.blackHole = getSuckedIn;
		that.hit.ship = function(impactPoint,isReversed){	
			VP.flatBounce.apply(this,[impactPoint,isReversed]);
			this.dead = true;
		};
		that.hit.solidRock = function(impactPoint,isReversed){	
			VP.mutualRoundBounce.apply(this,[impactPoint,isReversed]);
			this.dead = true;
		};
		that.hit.rock = function(impactPoint,isReversed){
			reportImpact.apply(this,[impactPoint,isReversed]);
			breakRock.apply(this,[impactPoint,isReversed]);
		}

		return that;
	}
	
	game.make.deadlyBullet = function (spec) {
		var that = game.make.bullet(spec);

		that.hit.ship = function(impactPoint,isReversed){	
			reportImpact.apply(this,[impactPoint,isReversed]);
			this.dead = true;
			var shipHit = impactPoint.item1 === this ? impactPoint.item2 : impactPoint.item1;
			console.log(game.cycleCount, shipHit.color+' '+shipHit.type+' shields='+shipHit.shield);
			
			shipHit.shield -= 0.1;
			if (shipHit.shield < 0 ) {shipHit.explode()}
			
		};

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

		that.defaultProjectile = spec.projectile || 'bullet';
		that.defaultProjectileSpec = spec.projectileSpec || {maxSpeed:30, radius:5, color:that.color, mass:4, lifeSpan:50};

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
			VP.flatBounce.apply(this,[impactPoint,isReversed]);
			this.explode();
		};
		that.hit.solidRock = that.hit.rock;
		
		that.hit.ground = function(impactPoint,isReversed) {
			//reportImpact(impactPoint,isReversed);
			if (impactPoint.force > 150) {
				//this.explode();
			}
			VP.reflectForceOffFlatSurface.apply(this, [impactPoint,isReversed]);
		}
		
		that.hit.blackHole = getSuckedIn;
		
		that.command = function(commandName, commandOptions){
			switch (commandName) {
			case "FIRE":
				if(this.coolDownLevel === 0) {
					this.launchProjectile();
					game.sound.play("zap.mp3");
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
		
		
		var launchProjectile = function(projectile,projectileSpec) {
			var projectileVector= game.calc.vectorFromForces([  {m:this.momentum.m, h:this.momentum.h} , {m:20,h:this.h}  ]);
			var projectileMomentum={
				m : Math.min(game.calc.distance(projectileVector),30),
				h : game.calc.headingFromVector(projectileVector)				
			};
			var spec = {
				x:this.x + (1.5*(this.radius+10)*projectileVector.x/projectileMomentum.m),
				y:this.y - (1.5*(this.radius+10)*projectileVector.y/projectileMomentum.m),
				h:(this.h/Math.PI),
				momentum:projectileMomentum,
			};
			
			projectileSpec = projectileSpec || this.defaultProjectileSpec;
			var keys = Object.keys(projectileSpec);
			for (var i=0; i<keys.length; i++) {
				spec[keys[i]] = projectileSpec[keys[i]];
			}
	
			game.session.items.push( game.make[projectile || this.defaultProjectile](spec));
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
			var randomSpeed = game.calc.round(Math.random()*5,3);
			var shardVector1 = game.calc.vectorFromForces([this.momentum, {h:randomHeading,m:randomSpeed}],3);
			var shard1 = game.make.rock({
				x:this.x+(5*shardVector1.x),
				y:this.y+(5*shardVector1.y),
				radius:Math.floor(this.radius*0.7),
				density:this.density,
				color:'red'
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
				x:this.x+(5*shardVector2.x),
				y:this.y+(5*shardVector2.y),
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