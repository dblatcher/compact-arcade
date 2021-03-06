export function spriteHandling (game) {

	var updateSpriteFrame	= function(){			
		if (game.cycleCount % game.library.spriteHandling.gameCyclesBetweenFrameUpdates === 0 ){
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
		
		if (!item.circular) {		
			ctx.drawImage(game.sprite[frame.source],
				frame.x,frame.y,item.spriteData.frameWidth,item.spriteData.frameHeight,
				item.x-plotOffset.x-leftOff, item.renderY-plotOffset.y-topOff,
				item.width+leftOff+rightOff,item.height+topOff);	
			
			/* for debugging - render the collision area as a rectangle
			ctx.beginPath();
			ctx.rect(item.x-plotOffset.x, item.renderY-plotOffset.y,item.width,item.height);
			ctx.stroke();
		*/
		};
		if (item.circular) {
			ctx.drawImage(game.sprite[frame.source],
				frame.x,frame.y,item.spriteData.frameWidth,item.spriteData.frameHeight,
				item.x-item.radius-plotOffset.x-leftOff, item.renderY-item.radius-plotOffset.y-topOff,
				item.radius*2,item.radius*2);	
			
		}
		
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
	
	var assignSpriteToItem = function(item,spriteName,initialAction,initialDirection,unstoppableActions) {
		unstoppableActions = unstoppableActions || [];
		
		//note - should game.spriteData be at game.library.spriteHandling.spriteData?
		item.spriteData = game.spriteData[spriteName];
		item.direction = initialDirection;
		item.action = initialAction;
		item.frame = item.spriteData.animateCycle[item.action][item.direction][0];
		item.automaticActions.push(game.library.spriteHandling.updateSpriteFrame);

		
	
		item.render = function(ctx,plotOffset) {
			game.library.spriteHandling.renderSprite(this,ctx,plotOffset);
		};
		
		
		if (typeof(unstoppableActions) === 'string') {unstoppableActions = [unstoppableActions]};
		if (!unstoppableActions.length) {item.setAction = game.library.spriteHandling.setAction}
	
		item.setAction = function(newAction,newDirection) {
			for (var i = 0; i < unstoppableActions.length; i++) {
				if (this.action === unstoppableActions[i]) {return false;};
			};
			game.library.spriteHandling.setAction.apply(this,[newAction,newDirection]);
		}
		
	}
	
	game.library.spriteHandling = {
		gameCyclesBetweenFrameUpdates:10,
		updateSpriteFrame:updateSpriteFrame,
		renderSprite:renderSprite,
		setAction:setAction,
		assignSpriteToItem:assignSpriteToItem
	};
	

	return game;
};