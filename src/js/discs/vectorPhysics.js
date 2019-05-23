/*
queRoundBounce : at step 5- if body 2 isn't also bouncing, the full force should be reflected back at body 1
add lost energy for non elastic collisions

*/

export function vectorPhysics(game) {
	game.library.vectorPhysics = {};
	var VP = game.library.vectorPhysics;

	Object.assign(game.session.environment, {
		gravitationalConstant :0.05,
		airDensity : 0,
		localGravity: 0
	});
	
	var runItemActions = function(){
		var collisions = [], pairs = [];
		var items = game.session.items;
		var collide,item1,item2,itemVelocity;
		
		function errorTest(Q){
			var badValues = [];
			if (!isFinite(Q.x)) {badValues.push('x')}
			if (!isFinite(Q.y)) {badValues.push('y')}
			if (!isFinite(Q.m)) {badValues.push('m')}
			if (!isFinite(Q.h)) {badValues.push('h')}
			if (badValues.length) {return badValues}
			return false;
		}
		
		for (var i = 0; i < items.length; i++) { // fire automaticActions, calculate queuedMove
			for (var a=0;a<items[i].automaticActions.length;a++) {
				if (typeof(items[i].automaticActions[a]) === 'function') {
					items[i].automaticActions[a].apply(items[i],[]);
				}
			};
			
			if (items[i].queuedMove) {
				
				itemVelocity = game.calc.vectorFromForces( [].concat(items[i].queuedForces,items[i].momentum) );
				
				items[i].queuedMove.h = game.calc.headingFromVector(itemVelocity);
				items[i].queuedMove.m = game.calc.distance(itemVelocity);
				
				if (items[i].queuedMove.m > items[i].maxSpeed) {
					itemVelocity.x = itemVelocity.x * (items[i].maxSpeed/items[i].queuedMove.m);
					itemVelocity.y = itemVelocity.y * (items[i].maxSpeed/items[i].queuedMove.m);
					items[i].queuedMove.m = items[i].maxSpeed;
				};
				items[i].queuedMove.x = itemVelocity.x;
				items[i].queuedMove.y = itemVelocity.y;
				
				if (errorTest(items[i].queuedMove)) {
					console.log('---------------')
					console.log(game.cycleCount, items[i].color+' '+items[i].type+' bad queuedMove',errorTest(items[i].queuedMove));
					console.log(i, items[i].queuedMove)
					console.log('itemVelocity',itemVelocity)
				}
				items[i].queuedForces = [];
				
			};
		};
		
		for (var i = 0; i < items.length; i++) { // detect collisions
			for (var j = 0; j < items.length; j++) {
				collide = false;
				
				if (i===j){continue};
				if ( pairs.filter(function(a){return (a[0]===j && a[1]===i)}).length ) {continue};

				if (items[i].circular) {
					if (items[j].circular) {
						collide	= VP.checkForQueCircleCollisions(items[i],items[j])
					} else {
						collide	= VP.checkForCircleRectCollisions(items[i],items[j])
					};
				};
				
				if (collide){
					collisions.push(collide);
					pairs.push([i,j]);
				}
			}
		}
		
		for (var i = 0; i < collisions.length; i++) { //fire hit functions for each collision
			item1 = collisions[i].item1;
			item2 = collisions[i].item2;
			if (typeof(item1.hit[item2.type]) === 'function') {
				item1.hit[item2.type].apply(item1,[collisions[i]])
			}	
			if (typeof(item2.hit[item1.type]) === 'function') {
				item2.hit[item1.type].apply(item2,[collisions[i],true])
			}
		};
		
		for (var i = 0; i < items.length; i++) { //move moving items
			if (items[i].queuedMove) {
				if (errorTest(items[i].queuedMove)) {
					console.log(game.cycleCount, '*non finite queuedMove for '+items[i].type,i, items[i].queuedMove)
					items[i].queuedMove = {x:0,y:0,h:0,m:0};
				};
			};
			if(typeof(items[i].move) == 'function') {items[i].move()};
		};		
		this.session.items = items.filter(function(item){return item.dead==false});	
	};
 game.runItemActions = runItemActions;	

	VP.assignVectorPhysics = function (item,spec) {
		if(!item.h) {item.h = spec.h || 0;}
		item.momentum = spec.momentum ? Object.assign({},spec.momentum) : {h:0,m:0};
		item.thrust = spec.thrust || 0;
		item.thrustPower = spec.thrustPower || 10;
		item.unmovedByGravity  = spec.unmovedByGravity || false;
		item.mass = spec.mass || 10;
		item.maxSpeed = spec.maxSpeed || 1000;
		item.queuedMove = {x:0,y:0,m:0,h:0};
		item.queuedForces = [];
		item.elasticity = spec.elasticity ||1;
		item.gravityMaxRange = spec.gravityMaxRange || false;
		

		var edgeBehaviourFunctions = {
			WRAP : function() {
				if (this.x > game.level[game.session.currentLevel].width) {this.x -= game.level[game.session.currentLevel].width}
				if (this.x < 0) {this.x += game.level[game.session.currentLevel].width}
				if (this.y > game.level[game.session.currentLevel].height) {this.y -= game.level[game.session.currentLevel].height}
				if (this.y < 0) {this.y += game.level[game.session.currentLevel].height}
			},
			DIE : function() {
				this.dead = true;
			}
		};

		
		if (typeof item.edgeBehaviour || spec.edgeBehaviour) {
			var edgeBehaviour = item.edgeBehaviour || spec.edgeBehaviour;
			
			item.handleEdgeOfLevel =  edgeBehaviourFunctions.WRAP;
			if (edgeBehaviourFunctions[edgeBehaviour]) { item.handleEdgeOfLevel = edgeBehaviourFunctions[edgeBehaviour]}

		}

		item.move = item.move || function () {	
			this.x += this.queuedMove.x;
			this.y -= this.queuedMove.y;
			this.momentum.m = this.queuedMove.m;
			this.momentum.h = this.queuedMove.h;
			this.queuedMove = {x:0,y:0,h:0,m:0};

			if ( this.y < 0 || this.x < 0 ||
			this.x > game.level[game.session.currentLevel].width ||
			this.y > game.level[game.session.currentLevel].height) {
					item.handleEdgeOfLevel();
				} 

						
		};
				
	};
 
 
	VP.checkForCircleRectCollisions = function (item1, item2) {
		if (item1 === item2) {return false};
		
		var vector = item1.queuedMove || {x:0, y:0,h:0,m:0};
		
		function errorTest(Q){
			var badValues = [];
			if (!isFinite(Q.x)) {badValues.push('x')}
			if (!isFinite(Q.y)) {badValues.push('y')}
			if (!isFinite(Q.m)) {badValues.push('m')}
			if (!isFinite(Q.h)) {badValues.push('h')}
			if (badValues.length) {return badValues}
			return false;
		};
		
		if (errorTest(vector)) {
			console.log(game.cycleCount, 'bad vector for ' + item1.color + ' ' + item1.type + 'in checkForCircleRectCollisions')
			console.log (vector);
		}
		
		
		var force = item1.mass && item1.momentum ? item1.mass*item1.momentum.m : 0;
		var force2 = item2.mass && item2.momentum ? item2.mass*item2.momentum.m : force;
		var result = {type:null, x:item1.x+vector.x, y:item1.y-vector.y, stopPoint:{x:item1.x,y:item1.y}, item1:item1, item2:item2, force:force, force2:force2};
		
		var movedObject = {
			x: (item1.x + vector.x),
			y: (item1.y - vector.y),
			circular:true,
			radius:item1.radius
		}
		
		// path of the circular item1 is described by circle for start position(item1), circle for end position (movedObject) and a rectangle(pathArea)
		// the pathArea's length is the distance traveled by item1, its height is item1's radius*2 (diameter). 
		// The mid point of each height edge are the centers of (item1) and (movedObject)
		

		if (game.calc.areIntersecting(item1,item2)) {
			result.type = "start inside";
			result.stopPoint = findStopPoint();
			return result;
		};
		
		if (game.calc.areIntersecting(movedObject,item2)) {
			result.type = "end inside";
			result.stopPoint = findStopPoint();
			return result;
		};

		
		if (pathAreaIntersectsItem2()) { 
			result.type = "passed through";
			result.stopPoint = findStopPoint();
			return result;
		};
		
		return false;
		
		function pathAreaIntersectsItem2() {
			var v, i1,i2,pathEdge,item2Edge;
			
			var item2Vert = [{x:item2.left, y:item2.y},
			{x:item2.left, y:item2.y+item2.height},
			{x:item2.right, y:item2.y},
			{x:item2.right, y:item2.y+item2.height}
			];
					
			var perpRadius1 = game.calc.vectorFromForces([{h:vector.h - Math.PI*0.5, m:item1.radius }]);
			var perpRadius2 = game.calc.vectorFromForces([{h:vector.h + Math.PI*0.5, m:item1.radius }]);
			
			var pathArea = [
				{x:item1.x + perpRadius1.x, y:item1.y+perpRadius1.y},
				{x:item1.x + perpRadius2.x, y:item1.y+perpRadius2.y},
				{x:item1.x + perpRadius1.x + vector.x, y:item1.y + perpRadius1.y + vector.y},
				{x:item1.x + perpRadius2.x + vector.x, y:item1.y + perpRadius2.y + vector.y}
			];
		
		
			var edge = [[0,1],[2,3],[0,2],[1,3]];
							// [0,1],[1,2],[2,3],[3,0]		
							
			// if any edges cross an edge of item2, they intersect
			// edges are [0]->[1] , [0]->[2], [1]->[3], [2]->[3]
			// but only need to test the edges of pathArea not in the circles,ie test edges[2] and edges[3]
			// WON'T BE THE CASE IF YOU GENERALISE THIS FOR ANY NON ALIGNED RECTANGLES
			
			
			for (i1 = 2; i1<4; i1++) {
				pathEdge = [ pathArea[ edge[i1][0] ],pathArea[ edge[i1][1] ] ];
				for (i2 =0; i2<4; i2++) {
					item2Edge = [ item2Vert [edge[i1][0]] ,item2Vert[ edge[i1][1] ] ];				
					if ( game.calc.doLineSegmentsIntersect(pathEdge[0],pathEdge[1],item2Edge[0],item2Edge[1]) ) {return true}	
				};
			};
			
			//if any corner of item2 is inside pathArea, they intersect
			// other way round would be captured by circle intersecting - all corners of pathArea are on the edge of the circles
			for (i1 =0; i1<4; i1++) {
				if ( isPointInsideNonAllignedPolygon(item2Vert[i1],pathArea) ) {return true};
			};
			
			return false;
					
			function isPointInsideNonAllignedPolygon(point, polygon) {
				var n = polygon.length;
				if (n<3) {return false}; 
				var extreme = {y:point.y, x:1000000};
				// to generalise, need put polygon points in order and not rely on the edge array
				var intersections = 0;
				for (var c=0; c < edge.length; c++ ) {
					if (game.calc.doLineSegmentsIntersect(point, extreme, polygon[edge[c][0]], polygon[edge[c][1]] ) ) {intersections++}
				};		
				if (intersections%2) {return true;}
				return false;
			}
			

		};
		
		
		function findStopPoint() {
			var yLine, xLine, point={}, t, tx,ty;
						
			if (vector.x > 0) {xLine = item2.left - item1.radius;};//moving right
			if (vector.x < 0) {xLine = item2.right + item1.radius;	}; // moving left
			if (vector.y < 0) {yLine = item2.y - item1.radius;};//moving down(top=zero)
			if (vector.y > 0) {yLine = item2.y + item2.height + item1.radius;};// moving up (top=zer0)
			
			// flat vectors
			if (vector.y == 0) {return{x:xLine, y:item1.y, edge:'x'}};
			if (vector.x == 0) {return{x:item1.x, y:yLine, edge:'y'}};
						
			tx = (xLine-item1.x)/vector.x;
			ty = (yLine-item1.y)/-vector.y;
			
			if (tx > ty) { return {x:xLine, y: item1.y + (tx*vector.y), edge:'x' } }
			else { return {x:item1.x + (ty * vector.x), y:yLine, edge:'y' } };
			
		};
	};
		
	VP.checkForQueCircleCollisions = function(item1, item2) {
		// can't collide with self!
		if (item1 === item2) {return false};
		
		var vector = item1.queuedMove  || {x:0, y:0,h:0,m:0};
		
		
		function errorTest(Q){
			var badValues = [];
			if (!isFinite(Q.x)) {badValues.push('x')}
			if (!isFinite(Q.y)) {badValues.push('y')}
			if (!isFinite(Q.m)) {badValues.push('m')}
			if (!isFinite(Q.h)) {badValues.push('h')}
			if (badValues.length) {return badValues}
			return false;
		};
		
		if (errorTest(vector)) {
			console.log(game.cycleCount, 'bad vector for ' + item1.color + ' ' + item1.type + 'in checkForQueCircleCollisions')
			console.log (vector)
		}
		
		
		var force = item1.mass && item1.momentum ? item1.mass*item1.momentum.m : 0;
		var force2 = item2.mass && item2.momentum ? item2.mass*item2.momentum.m : force;

		var movedObject = {
			x: (item1.x + vector.x),
			y: (item1.y - vector.y),
			circular:true,
			radius:item1.radius
		}
		
		if (game.calc.areIntersecting (item1,item2) ) {
			var unitVector = {};
			var stopPoint = {x:item1.x,y:item1.y};			
			 
			 // this doesn't work well - shoves the object back the shortest route out of item2
			// should move backward relative to direction of travel - use the c calculation below
			if (item1.mass <= item2.mass) { // only move the lighter object out of the way
				var distanceBetweenCenters = game.calc.distance(item1,item2);
				if (distanceBetweenCenters){
					var vectorBetweenCenters = {x:item1.x-item2.x, y:item1.y-item2.y};
					var vectorSize = game.calc.distance(vectorBetweenCenters);
					unitVector = {
							x:vectorBetweenCenters.x/vectorSize,
							y:vectorBetweenCenters.y/vectorSize
						};
				} else {
					unitVector.x = Math.random()
					unitVector.y = 1- unitVector.x ;
				}
					
				var shiftDistance = item1.radius + item2.radius - distanceBetweenCenters;
				stopPoint.x += unitVector.x*shiftDistance;
				stopPoint.y += unitVector.y*shiftDistance;
			}
			
			return {type:'start inside', x:item1.x, y:item1.y, stopPoint:stopPoint, item1:item1, item2:item2, force:force,force2:force2};
		};
		
		var d = game.calc.closestpointonline(item1,movedObject,item2);
		var closestDist = game.calc.distance(item2,d);		
		var closestDistSq = closestDist*closestDist;
		
		if (game.calc.areIntersecting (movedObject,item2) ) {
			var backdist = Math.sqrt(Math.pow(movedObject.radius + item2.radius, 2) - closestDistSq); 
			var movementvectorlength = game.calc.distance(vector);
			var c = {
				x:d.x + backdist * (-vector.x / movementvectorlength),
				y:d.y + backdist * (vector.y / movementvectorlength)
			};
			var i ={
				x:c.x + (movedObject.radius * -Math.sin(game.calc.headingFromVector(c.x-item2.x,c.y-item2.y)) ),
				y:c.y + (movedObject.radius * -Math.cos(game.calc.headingFromVector(c.x-item2.x,c.y-item2.y)) )
			}

			return {type:'end inside', x:i.x, y:i.y,stopPoint:c,item1:item1, item2:item2,force:force, force2:force2};
		};
					

		if(closestDist <= item2.radius + movedObject.radius){ //collision course 						
			var backdist = Math.sqrt(Math.pow(movedObject.radius + item2.radius, 2) - closestDistSq); 
			var movementvectorlength = game.calc.distance(vector);
			var c = {
				x:d.x + backdist * (-vector.x / movementvectorlength),
				y:d.y + backdist * (vector.y / movementvectorlength)
			};
			
		
			var objectMovesThroughC = false;
			if (vector.x !== 0) {
				if (
					(item1.x < c.x && c.x < movedObject.x) ||
					(item1.x > c.x && c.x > movedObject.x)
				) {
					objectMovesThroughC = true;
				}
			} else { //no x velocity, so check by y coords
				if (
					(item1.y < c.y && c.y < movedObject.y) ||
					(item1.y > c.y && c.y > movedObject.y)
				) {
					objectMovesThroughC = true;
				}
			}
			
			if ( objectMovesThroughC ) { 
				var i ={
					x:c.x + (movedObject.radius * -Math.sin(game.calc.headingFromVector(c.x-item2.x,c.y-item2.y)) ),
					y:c.y + (movedObject.radius * -Math.cos(game.calc.headingFromVector(c.x-item2.x,c.y-item2.y)) )
					}; 
			 return {type:'passed through', x:i.x, y:i.y, stopPoint:c,item1:item1, item2:item2,force:force,force2:force2};
			}
			
		}; 
				
		return false;
			
	}

	VP.findBounceVectors = function(body1,body2) {
		//step 1 - normal unit vector and tangent unit vector
		var n = {x: body2.x-body1.x, y: body2.y-body1.y};
		n.mag = game.calc.distance(n);
		var un = {x: n.x/n.mag, y:n.y/n.mag }
		var ut = {x:-un.y, y:un.x};
		
		//step 2 - define pre collision vectors
		var v1 = game.calc.vectorFromForces([body1.momentum]);
		var v2 = game.calc.vectorFromForces([body2.momentum]);
		
		// step3 express pre collision vectors in unit normal and tangent
		var v1n = (un.x * v1.x) + (un.y * v1.y);
		var v1t = (ut.x * v1.x) + (ut.y * v1.y);
		var v2n = (un.x * v2.x) + (un.y * v2.y);
		var v2t = (ut.x * v2.x) + (ut.y * v2.y);
		
		//step 4 tangential velocity doesn't change
		var v_1t = v1t;
		var v_2t = v2t;
		
		//step 5 new normal velocity
		var v_1n = ( (v1n * (body1.mass - body2.mass)) + 2*body2.mass*v2n ) /(body1.mass + body2.mass);
		var v_2n = ( (v2n * (body2.mass - body1.mass)) + 2*body1.mass*v1n ) /(body1.mass + body2.mass);
		
		//step 6 convert new normal and tangential velocities in Vectors 
		//mutliply by unit vectors 
		var V_1n = {x:v_1n*un.x, y:v_1n*un.y};
		var V_1t = {x:v_1t*ut.x, y:v_1t*ut.y};
		
		var V_2n = {x:v_2n*un.x, y:v_2n*un.y};
		var V_2t = {x:v_2t*ut.x, y:v_2t*ut.y};
		
		// step 7 - add component vectors
		var newVector1 = {x: V_1n.x + V_1t.x, y: V_1n.y + V_1t.y};
		var newVector2 = {x: V_2n.x + V_2t.x, y: V_2n.y + V_2t.y};
		
		return {
			vector1:newVector1,
			vector2:newVector2
		};
		
	};
	
	VP.queRoundBounce = function (impactPoint,reverseItems) { //not using this one currently
		if (reverseItems) {return false};
		var body1,body2;
		body1 = impactPoint.item1;
		body2 = impactPoint.item2;
		// this seems wrong - moving out of sequence
		body1.x = impactPoint.stopPoint.x;
		body1.y = impactPoint.stopPoint.y;
		
		
		var bounce = VP.findBounceVectors(body1,body2);		
		body1.queuedMove.h = game.calc.headingFromVector(bounce.vector1);
		body1.queuedMove.m = game.calc.distance(bounce.vector1);
		body1.queuedMove.x = bounce.vector1.x;
		body1.queuedMove.y = bounce.vector1.y;
	
	};
	
	VP.mutualRoundBounce = function(impactPoint,reverseItems) {
		if (reverseItems) {return false};
		var body1,body2;
		body1 = reverseItems ? impactPoint.item2 : impactPoint.item1;
		body2 = reverseItems ? impactPoint.item1 : impactPoint.item2;
		// this seems wrong - moving out of sequence

		body1.x = impactPoint.stopPoint.x;
		body1.y = impactPoint.stopPoint.y;

		if(game.calc.areIntersecting(body1,body2)) {
			var distanceToSeparate = 1 + body1.radius + body2.radius - game.calc.distance(body1,body2);
			var headingToSeparate = game.calc.headingFromVector ({x:body1.x-body2.x, y:body1.y-body2.y});
			var magicV = game.calc.vectorFromForces([{m:distanceToSeparate, h:headingToSeparate}]);
			body1.x += magicV.x/2;
			body1.y += magicV.y/2;
			body2.x -= magicV.x/2;
			body2.y -= magicV.y/2;
		}
		
		var bounce = VP.findBounceVectors(body1,body2);		
		body1.queuedMove.h = game.calc.headingFromVector(bounce.vector1);
		body1.queuedMove.m = game.calc.distance(bounce.vector1);
		body1.queuedMove.x = bounce.vector1.x;
		body1.queuedMove.y = bounce.vector1.y;
		
		body2.queuedMove.h = game.calc.headingFromVector(bounce.vector2);
		body2.queuedMove.m = game.calc.distance(bounce.vector2);
		body2.queuedMove.x = bounce.vector2.x;
		body2.queuedMove.y = bounce.vector2.y;
	};
	
	VP.reflectForceOffFlatSurface = function (impactPoint,reverseItems) {
		this.x = impactPoint.stopPoint.x;
		this.y = impactPoint.stopPoint.y;
		var newHeading = game.calc.reflectHeading(this.queuedMove.h,impactPoint.stopPoint.edge === 'x' ? Math.PI*0.01 : Math.PI*0.5)		
		this.queuedMove.h = newHeading;
		
		if (typeof(this.elasticity) === 'number'){this.queuedMove.m *= this.elasticity};
		
		var newVector = game.calc.vectorFromForces([this.queuedMove])
		this.queuedMove.x = newVector.x;
		this.queuedMove.y = newVector.y;

	};
	
	VP.flatBounce = function (impactPoint,thisIsImpactedBody) {
		if (thisIsImpactedBody) {return false};
		var body1 = impactPoint.item1;
		var body2 = impactPoint.item2;
		
		var vector1 = game.calc.vectorFromForces([body1.momentum],3);
		var vector2 = body2.momentum ? game.calc.vectorFromForces([body2.momentum],3) : {x:0,y:0};
		
		var newVector1 = {};
		newVector1.x = (vector1.x * (body1.mass - body2.mass) + (2 * body2.mass * vector2.x)) / (body1.mass + body2.mass);			
		newVector1.y = (vector1.y * (body1.mass - body2.mass) + (2 * body2.mass * vector2.y)) / (body1.mass + body2.mass);
		var newVector2 = {};
		newVector2.x = (vector2.x * (body2.mass - body1.mass) + (2 * body1.mass * vector1.x)) / (body1.mass + body2.mass);
		newVector2.y = (vector2.y * (body2.mass - body1.mass) + (2 * body1.mass * vector1.y)) / (body1.mass + body2.mass);
		
		body1.x = impactPoint.stopPoint.x - newVector1.x;
		body1.y = impactPoint.stopPoint.y + newVector1.y;
			
		body1.queuedMove = {
			h:game.calc.headingFromVector(newVector1),
			m:Math.min(game.calc.distance(newVector1),body1.maxSpeed),
			x:newVector1.x,
			y:newVector1.y
		};
	
		if (body2.queuedMove) {
			body2.queuedMove ={
				h:game.calc.headingFromVector(newVector2),
				m:Math.min(game.calc.distance(newVector2),body2.maxSpeed),
				x:newVector2.x,
				y:newVector2.y
			};
		}		
	}
	
	
	VP.thrustForce = function() {
		if (this.thrust > 1) {this.thrust = 1}
		if (this.thrust < 0) {this.thrust = 0}
		if (this.thrust > 0) { 
			this.queuedForces.push( {m:(this.thrust*this.thrustPower/this.mass), h:this.h} ) 
		};
	}
	
	VP.airResistForce = function(){	
		if(!this.momentum.m) {return false}
		var F;
		var airDensity = game.session.environment.airDensity;
		var dragCoef = 0.01;
		var area = this.radius * Math.PI;
				
		F = (airDensity * dragCoef * area / 2) * (this.momentum.m * this.momentum.m);
		F = Math.min(F,this.momentum.m)
		this.queuedForces.push({
			m:F,
			h:game.calc.reverseHeading(this.momentum.h)
		});
	};
	
	VP.globalGravityForce = function() {
		this.queuedForces.push({
			m:game.session.environment.gravitationalConstant * game.session.environment.localGravity,
			h:Math.PI*1
		});
	};
	
	VP.exertGravity = function() {
		var gravitySource = this;
		
		function areEffectedByGravity(item) {
			if (item === gravitySource) {return false;} // don't exert on self
			if (!item.momentum) {return false;} // only exhert on items that have VP movement
			if (!item.mass) {return false;} // gravity only effects bodies with mass
			if (item.unmovedByGravity) {return false;} 
			return true;
		};
		function findGravityForce(body1,body2) {
			if (game.calc.areIntersecting(body1,body2)) {return {m:0,h:0}};
			var r = game.calc.distance(body1,body2);
			if (gravitySource.gravityMaxRange !== false) {
				if (r-body1.radius-body2.radius>gravitySource.gravityMaxRange) {return {m:0,h:0}};
			}
			var m = (game.session.environment.gravitationalConstant * ((body1.mass * body2.mass) / Math.pow(r,2)) );
			var h = game.calc.headingFromVector(body1.x - body2.x , body2.y - body1.y);
			return {m:m,h:h}
		};
		
		var effectedItems = game.session.items.filter(areEffectedByGravity);
		for (var i = 0; i < effectedItems.length; i++) {
			effectedItems[i].queuedForces.push(findGravityForce(gravitySource, effectedItems[i]));			
		};
		
	};
	
	return game;
};