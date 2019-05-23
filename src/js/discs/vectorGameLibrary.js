export function vectorGameLibrary(game, options) {

    game.library.vectorGame = {};
	var lib = game.library.vectorGame;

	lib.slowDown_AI = function () {
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
	
	lib.attack_AI = function(){
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
	
	lib.findThreatsTo = function (ship){
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

	lib.evadeThreat_AI = function() {
		var threats = lib.findThreatsTo(this);
		
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
			lib.slowDown_AI.apply(this,[])
		};
		
	}

    lib.thrustMeter = {
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
	
    lib.mapWidget = function(c,ctx,plotOffset) {
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

    return game;
};