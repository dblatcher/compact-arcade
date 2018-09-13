function spriteHandling (game) {

	var updateSpriteFrame	= function(){			
		if (game.cycleCount % 10 === 0 ){
			this.frame++;
			if (this.frame >= this.spriteData.animateCycle[this.action][this.direction].length) {
				if (this.spriteData.animateCycle[this.action].end) {
					this.spriteData.animateCycle[this.action].end.apply(this,[]);
				} else {this.frame=0;}
			};
		};
	};

	var renderSprite = function(item,ctx,plotOffset) {
		
		var frame = item.spriteData.frameMap[item.spriteData.animateCycle[item.action][item.direction][item.frame]];
		
		var leftOff = (item.direction === 'left') ?
			item.spriteData.frontOff*item.width || 0:
			item.spriteData.backOff*item.width || 0;
		var rightOff = (item.direction === 'right') ?
			item.spriteData.frontOff*item.width || 0:
			item.spriteData.backOff*item.width || 0;
		var topOff = item.spriteData.topOff*item.height || 0;
	
		ctx.beginPath();
		ctx.drawImage(game.sprite[frame.source],
			frame.x,frame.y,item.spriteData.frameWidth,item.spriteData.frameHeight,
			item.x-plotOffset.x-leftOff, item.plotY()-plotOffset.y-topOff,
			item.width+leftOff+rightOff,item.height+topOff);	
		
		/* for debugging - render the collision area as a rectangle
		ctx.beginPath();
		ctx.rect(item.x-plotOffset.x, item.plotY()-plotOffset.y,item.width,item.height);
		ctx.stroke();
		*/
	};
	
	var setAction = function(newAction,newDirection) {
		newDirection = newDirection || this.direction;
		if (newDirection === 'reverse') {newDirection = this.direction === 'left' ? 'right' : 'left'};
		if (newAction === this.action && newDirection === this.direction) {return false};
		this.action = newAction;
		this.direction = newDirection;
		this.frame = 0;
		return(true);
	};	
	
	game.library.spriteHandling = {
		updateSpriteFrame:updateSpriteFrame,
		renderSprite:renderSprite,
		setAction:setAction
	};
	

	return game;
};