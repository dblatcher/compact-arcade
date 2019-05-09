export function vectorGraphics(game) {
	game.library.vectorGraphics = {};
	
	game.library.vectorGraphics.createRelativeLinearGradient = function(item,colorStop,shape,plotOffset){
		var ctx = game.canvasElement.getContext("2d");	
		plotOffset = plotOffset || {x:0,y:0};
		shape = shape || {x1:-1,y1:-1,x2:-1,y2:1};
		
		var pointX = function (X,Y) {
			return item.radius*( (X * Math.cos(item.h)) - (Y * Math.sin(item.h)) )  + item.x - plotOffset.x ;
		};
		var pointY = function (X,Y) {
			return item.radius*( (X * Math.sin(item.h)) + (Y * Math.cos(item.h)) ) + item.y - plotOffset.y;
		};
		
		var gradient = ctx.createLinearGradient(pointX(shape.x1,shape.y1),pointY(shape.x1,shape.y1),pointX(shape.x2,shape.y2),pointY(shape.x2,shape.y2));
		
		for (var d=0; d<colorStop.length; d++) {
			gradient.addColorStop(colorStop[d].v, colorStop[d].color);
		}
		
		return gradient;
	};
	
	game.library.vectorGraphics.renderVectorItem = function(item,ctx,plotOffset){
		var order, coord={x:item.x,y:item.y}, drawOrders = item.draw(),gradient;
		ctx.lineWidth = 2;
		ctx.strokeStyle = item.color;
	
		ctx.beginPath();
		ctx.moveTo(- plotOffset.x + item.x,- plotOffset.y + item.y)
		
		for (var p = 0; p < drawOrders.length; p++) {
			order = drawOrders[p];
			switch (order.com) {
				
			case 'closePath':
			case 'beginPath':	
			case 'fill':
			case 'stroke':
				ctx[order.com]();
				break;
				
			case 'lineTo': 
			case 'moveTo':
				setPointRelativeToRoundItem(coord,order,item);
				ctx[order.com](
					coord.x - plotOffset.x + item.x,
					coord.y - plotOffset.y + item.y
				);
				break;
			
			case 'strokeStyle' :
			case 'fillStyle' :
				//so that the new style applies from that point forward in the path, not the parts already drawn
				if (order.com == 'strokeStyle' && !order.retroactive) {
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(coord.x - plotOffset.x + item.x,coord.y - plotOffset.y + item.y);
				};
				
				if (order.v) {ctx[order.com] = order.v};					
				if (order.colors) {
					gradient = ctx.createRadialGradient(
						item.x-plotOffset.x,item.y-plotOffset.y,
						item.radius*order.start || 0, 
						item.x-plotOffset.x,item.y-plotOffset.y,
						item.radius*order.end || item.radius
					);				
					for (var d=0; d<order.colors.length; d++) {
						gradient.addColorStop(order.colors[d].v, order.colors[d].color);
					};
					ctx[order.com] = gradient;
				};			
				break;
				
			case 'arc':
				setPointRelativeToRoundItem(coord,order,item);
				if (typeof order.startAngle === 'undefined') {order.startAngle = 0}
				if (typeof order.endAngle === 'undefined') {order.endAngle = 2}
				ctx.arc(
					coord.x - plotOffset.x + item.x,
					coord.y - plotOffset.y + item.y,
					order.r*item.radius,
					order.startAngle*Math.PI + item.h,
					order.endAngle*Math.PI + item.h,
					order.counterclockwise||false
				);
				break;
				
			case 'arcTo' :
				setPointRelativeToRoundItem(coord,order.tangent,item,'tx','ty');
				setPointRelativeToRoundItem(coord,order,item,'x','y');
				ctx.arcTo (
					coord.tx - plotOffset.x + item.x,
					coord.ty - plotOffset.y + item.y,
					coord.x - plotOffset.x + item.x,
					coord.y - plotOffset.y + item.y,
					order.r * item.radius
				);
				break;
			
			case 'quadraticCurveTo':
				setPointRelativeToRoundItem(coord,order, item);
				setPointRelativeToRoundItem(coord,order.controlPoint,item,'cx','cy');
				ctx[order.com](
					coord.cx - plotOffset.x + item.x,
					coord.cy - plotOffset.y + item.y,
					coord.x - plotOffset.x + item.x,
					coord.y - plotOffset.y + item.y
				);
				break;
				
			case 'bezierCurveTo':
				setPointRelativeToRoundItem(coord,order, item);
				setPointRelativeToRoundItem(coord,order.controlPoint,item,'cx','cy');
				setPointRelativeToRoundItem(coord,order.controlPoint2,item,'cx2','cy2');
				ctx[order.com](
				coord.cx - plotOffset.x + item.x,
				coord.cy - plotOffset.y + item.y,
				coord.cx2 - plotOffset.x + item.x,
				coord.cy2 - plotOffset.y + item.y,
				coord.x - plotOffset.x + item.x,
				coord.y - plotOffset.y + item.y
				);
				break;
				
			default:
				console.log('unhandled order type ['+ order.com + '].');
				console.log(item);
			};
		};		
	
		ctx.stroke();
		
		function setPointRelativeToRoundItem(coordinateObject, point, originItem, xVal, yVal){	
			xVal = xVal || 'x';
			yVal = yVal || 'y'; 
			if (typeof(point.d) == 'number') {
				coordinateObject[xVal] = Math.sin(originItem.h + Math.PI*point.h)*point.d*originItem.radius;
				coordinateObject[yVal] = -Math.cos(originItem.h + Math.PI*point.h)*point.d*originItem.radius;
			};
			if (typeof(point.x) == 'number') {
				coordinateObject[xVal] = originItem.radius*( (point.x * Math.cos(originItem.h)) - (point.y * Math.sin(originItem.h)) );
				coordinateObject[yVal] = originItem.radius*( (point.x * Math.sin(originItem.h)) + (point.y * Math.cos(originItem.h)) );
			};
			return coordinateObject;
		};
		
	}
	
	game.library.vectorGraphics.assignVectorRender = function(item,spec) {
		if (!item.draw) {
			item.draw = function() {return [{com:'arc',h:0,d:0,r:1,startAngle:1.5001,endAngle:1.5}];};
		};
		if(!item.h) {item.h = spec.h || 0;}
		item.render = function(ctx,plotOffset){
			game.library.vectorGraphics.renderVectorItem(this,ctx,plotOffset);
		};
		return item;
	}
	
	game.make.roundVectorItem = function(spec) {
		var that = game.make.roundItem(spec);
		that.h = spec.h || 0;
		
		var render = function(ctx,plotOffset){
			game.library.vectorGraphics.renderVectorItem(this,ctx,plotOffset);
		};
		that.render = render;
		
		var draw = function() {
			return [
				{com:'arc',h:0,d:0,r:1,startAngle:1.5001,endAngle:1.5}
			];
		};
		that.draw = draw;
		
		return that;
	}
			
	return game;
};