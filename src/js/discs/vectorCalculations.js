export function vectorCalculations(game,options) {

	game.calc.vectorFromForces = function(forceArray,roundingFactor) {
		var result = {x:0,y:0};
		roundingFactor = roundingFactor || 5;
		
		for (var a = 0; a<forceArray.length; a++) {
			if (!isFinite(forceArray[a].m) || !isFinite(forceArray[a].h)) {continue;}
			result.x += forceArray[a].m * Math.sin(forceArray[a].h);
			result.y += forceArray[a].m * Math.cos(forceArray[a].h);
		}		
		
		result.x = game.calc.round(result.x,roundingFactor);
		result.y = game.calc.round(result.y,roundingFactor);
		return result;
	}
	
	game.calc.headingFromVector = function (x,y) {
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
	
	game.calc.normaliseHeading = function(h){
		return h%(Math.PI*2) > 0 ? h%(Math.PI*2): h%(Math.PI*2)+(Math.PI*2)
	} 
	
	game.calc.reflectHeading = function (heading,wallAngle) {
		var reflect = 2*wallAngle - heading;
		if (reflect < (Math.PI)*0) {reflect += (Math.PI)*2};
		if (reflect > (Math.PI)*2) {reflect -= (Math.PI)*2};
		if (reflect === heading) {reflect = game.calc.reverseHeading(reflect)}
		return reflect;
	};
		
	game.calc.tangent = function (circle, point) {
		var radiusHeading = game.calc.headingFromVector (circle.x - point.x, circle.y - point.y);
		var tangentHeading = radiusHeading + (Math.PI)*0.5;
		if (tangentHeading > (Math.PI)*2) {tangentHeading -= (Math.PI)*2};
		return tangentHeading;
	};
		
	game.calc.reverseHeading = function (h){
		var result;
		result = h + Math.PI;
		if (result > Math.PI * 2) {result -= Math.PI * 2}
		return result;
	};
			
	game.calc.closestpointonline = function (L1,L2,p0) {						
		
		if (!isFinite(L2.x) && !isFinite(L2.y) ){
			console.log(game.cycleCount,'bad L2 passed to closestpointonline, returning L1 coords');
			return ({x:L1.x, y:L1.y});
		}
		
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
			console.log(game.cycleCount,'closestpointonline error');
			console.log(L1,L2,p0);
		}
		
		return{x:cx,y:cy};
	}
	
	// The main function that returns true if line segment 'p1q1' and 'p2q2' intersect. 
	game.calc.doLineSegmentsIntersect =	function (p1, q1, p2,q2) {
		// Given three colinear points p, q, r, the function checks if 
		// point q lies on line segment 'pr' 
		function onSegment(p,q,r) { 
			if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&  q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)) {
				 return true; 
			}  
			return false; 
		} 

		// To find orientation of ordered triplet (p, q, r). 
		// The function returns following values 
		// 0 --> p, q and r are colinear 
		// 1 --> Clockwise 
		// 2 --> Counterclockwise 
		function orientation(p,q,r) { 
				var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y); 
				if (val == 0) return 0;  // colinear 
				return (val > 0)? 1: 2; // clock or counterclock wise 
		} 

		// Find the four orientations needed for general and 
		// special cases 
		var o1 = orientation(p1, q1, p2); 
		var o2 = orientation(p1, q1, q2); 
		var o3 = orientation(p2, q2, p1); 
		var o4 = orientation(p2, q2, q1); 
	
		// General case 
		if (o1 != o2 && o3 != o4) {return true};
	
		// Special Cases 
		// p1, q1 and p2 are colinear and p2 lies on segment p1q1 
		if (o1 == 0 && onSegment(p1, p2, q1)) {return true}; 
	
		// p1, q1 and q2 are colinear and q2 lies on segment p1q1 
		if (o2 == 0 && onSegment(p1, q2, q1)) {return true}; 
	
		// p2, q2 and p1 are colinear and p1 lies on segment p2q2 
		if (o3 == 0 && onSegment(p2, p1, q2)) {return true}; 
	
		 // p2, q2 and q1 are colinear and q1 lies on segment p2q2 
		if (o4 == 0 && onSegment(p2, q1, q2)) {return true}; 
	
		return false; // Doesn't fall in any of the above cases 
	} 
				
	
	return game;
};