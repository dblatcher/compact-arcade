function backgroundStars(game) {
	game.library.backgroundStars = {
		defineStars : function(level) {
			var currentLevel = game.level[level];
			var number =  200;
			var depth = 3;
			var colorRange =  ['white', 'white', 'red'];
			var star = [];
			
			for (var i = 0; i< number; i++) {
				star[i] = {
					x : Math.floor(Math.random() * currentLevel.width),
					y : Math.floor(Math.random() * currentLevel.height),
					color : colorRange[Math.floor(Math.random() * colorRange.length)],
					parallax : 1 + Math.floor(Math.random() * depth)
				};
			}
			game.session.starfield = star;
		},	
		plotStars : function(c,ctx,plotOffset){
			var star;
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,c.width,c.height);
			for (var p = 0; p < game.session.starfield.length; p++) {
				star  = game.session.starfield[p]	
				ctx.beginPath();
				ctx.fillStyle = star.color;
				ctx.fillRect(star.x-(plotOffset.x/star.parallax),star.y-(plotOffset.y/star.parallax),2,2);
			};
		}
	};
	
	game.customNewLevelAction = function(level) {
		game.library.backgroundStars.defineStars(level);
	};

	game.renderBackground = function(c,ctx,plotOffset) {
		game.library.backgroundStars.plotStars(c,ctx,plotOffset);
	}; 

	return game;
}