
function landerGameLevels(game, options) {
		
	
	var ourLevels = {		
	moonbaseAlpha: {name: "moonbase alpha", width:1000, height:2500,
		items:[
			{func:"landingCraft", spec:{x:200,y:1350,h:0.0*Math.PI, mass: 50,
			v:0,radius:20,elasticity:0.25,thrust:0, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}
			, isPlayer:true},		
			{func:'landingCraft', spec:{x:800,y:1350,h:0,thrust:0.45,v:0, mass:50,radius:20,color:'white'}},
			{func:"boulder", spec:{x:500,y:4950,radius:2550, pattern:"stone.jpg"}},
			{func:"landingZone", spec:{x:500,y:2400,width:300,height:50, isGoal:true,color:'green'}},
			{func:"boulder", spec:{x: 200, y:2450, radius:50, pattern: "stone.jpg"}},
			{func:"boulder", spec:{x: 350, y:2430, radius:60, pattern: "stone.jpg"}},
		],
		effects:[
			{func:'targetGuide', spec: {x:500, width:300, height:20, lastFrame:150, color:'green'} }
		],
		environment : {
			gravitationalConstant: 1,
			airDensity: 0.01,
			localGravity:0.1
		},
		background : {
			planetRadius: 2000,
			atmosphereDepth: 800,
			atmosphereColor: '150,140,255'
		},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.timePlayerOn > 20)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	},
	moonbaseBeta: {name: "moonbase beta", width:1000, height:2500,
		items:[
			{func:"landingCraft", spec:{x:200,y:1300,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.5,thrust:0, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}},isPlayer:true},		
			{func:"boulder", spec:{x:500,y:4950,radius:2550, pattern:"soil.jpg"}},
			{func:"ground", spec:{x:0,y:2500-500,width:200,height:500, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:200,y:2500-350,width:150,height:50, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:800,y:2500-650,width:200,height:600, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:800,y:2500-80,radius:100, pattern:"soil.jpg"}},
			{func:"landingZone", spec:{x:300,y:2500-100,width:300,height:50, isGoal:true,color:'green'}},
			{func:"landingZone", spec:{x:50,y:2500-510,width:50,height:10, isRefuel:true,color:'red'}}
			],
		effects:[
			{func:'targetGuide', spec: {x:50, width:50, height:20, lastFrame:150, color:'red'} }
		],
		backgroundStars:{
			number:500
		},			
		environment : {
			gravitationalConstant: 1,
			airDensity: 0.008,
			localGravity:.1
		},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.timePlayerOn > 20)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	},	
	slowdrop:	{name: "Breezio four", width:1000, height:2500,
			items:[
				{func:"landingCraft", spec:{x:150,y:2500-1200,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.25,thrust:0, thrustPower: 15,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
				{func:'landingCraft', spec:{x:800,y:1950,h:1,v:0, mass:50,radius:20,color:'white'}},
				{func:"ground", spec:{x:0,y:2450,width:1000,height:50, pattern:"soil.jpg"}},
				{func:"landingZone", spec:{x:500,y:2400,width:300,height:50, isGoal:true,color:'green'}},
				],
			effects:[
				{func:'targetGuide', spec: {x:500, width:300, height:20, lastFrame:200,color:'green'}},
			],
			environment : {
				gravitationalConstant: 1,
				airDensity: 0.1,
				localGravity:.08
			},
			background : {
				planetRadius: 2000,
				atmosphereDepth: 1000,
				atmosphereColor: '150,40,160'
			},
			victoryCondition: function () {
				return (game.session.items.filter(function(item){return(item.isGoal && item.playerHasLanded)}).length > 0);
			},
			failureCondition: function() {
				return game.session.player.stuck;
			}
		},
	trench: { name:"The Grand Canyon of Cygnus 4", width:1000, height:2500,
			items: [
				{func:"landingCraft", spec:{x:150,y:2500-1470,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.25, thrustPower: 15,color:'red'}, isPlayer:true},			
				{func:"ground", spec:{x:0,y:2500-50,width:1000,height:50, pattern:"stone.jpg"}},
				{func:"ground", spec:{x:0,y:2500-1450,width:250,height:1400, pattern:"stone.jpg"}},
				{func:"ground", spec:{x:750,y:2500-1450,width:250,height:1000, pattern:"stone.jpg"}},
				{func:"ground", spec:{x:900,y:2500-350,width:100,height:400, pattern:"stone.jpg"}},
				{func:"ground", spec:{x:900,y:2500-350,width:100,height:400, pattern:"stone.jpg"}},
				{func:"boulder", spec:{x:260,y:2500-980,radius:200, pattern:"stone.jpg"}},
				{func:"boulder", spec:{x:760,y:2500-690,radius:240, pattern:"stone.jpg"}},
				{func:"boulder", spec:{x:235,y:2500-50,radius:180, pattern:"stone.jpg"}},
				{func:"landingZone", spec:{x:600,y:2500-60,width:300,height:10, isGoal:true,color:'green'}},
				
			],
			effects: [],
			environment: {
				airDensity: 0.0015,
				localGravity: 0.75
			},
			background: {},
			
			victoryCondition: function () {
				return (game.session.items.filter(function(item){return(item.isGoal && item.playerHasLanded)}).length > 0);
			},
			failureCondition: function() {
				return game.session.player.stuck;
			}
		},
	cavern: { name: "Caverns of Proxima 7", width:2000, height:1000,
		items: [
			{func:"landingCraft", spec:{x:150,y:1000-70,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.25, thrustPower: 15,color:'red'}, isPlayer:true},			
			{func:"ground", spec:{x:0,y:1000-50,width:2000,height:50, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:0,y:0,width:2000,height:150, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:0,y:0,width:10,height:1000, pattern:"soil.jpg"}},
			{func:"ground", spec:{x:2000-10,y:0,width:10,height:1000, pattern:"soil.jpg"}},
			
			{func:"ground", spec:{x:75,y:150,width:80,height:200, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:115,y:350,radius:40, pattern:"stone.jpg"}},
			
			{func:"ground", spec:{x:200,y:150,width:100,height:80, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:250,y:230,radius:50, pattern:"stone.jpg"}},
			
			{func:"ground", spec:{x:500,y:150,width:50,height:180, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:500+25,y:150+180,radius:25, pattern:"stone.jpg"}},
			{func:"ground", spec:{x:600,y:150,width:40,height:130, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:600+20,y:130+150,radius:20, pattern:"stone.jpg"}},
			
			{func:"boulder", spec:{x:500,y:1000,radius:200, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:700,y:1100,radius:200, pattern:"stone.jpg"}},
			
			{func:"ground", spec:{x:850,y:500,width:400,height:500, pattern:"stone.jpg"}},
			
			
			{func:"ground", spec:{x:1100,y:150,width:200,height:50, pattern:"stone.jpg"}},
			
			{func:"boulder", spec:{x:1100,y:150,radius:50, pattern:"stone.jpg"}},
			{func:"boulder", spec:{x:1300,y:150,radius:50, pattern:"stone.jpg"}},
			
			{func:"ground", spec:{x:1700,y:0,width:400,height:50, pattern:"stone.jpg"}},
		],
		effects: [],
		environment: {localGravity: 0.6, airDensity:0.005},
		backgroundStars: {number:800, colorRange: ['gray'], depth :1},
		victoryCondition: function () {
			return (game.session.items.filter(function(item){return(item.isGoal && item.playerHasLanded)}).length > 0);
		},
		failureCondition: function() {
			return game.session.player.stuck;
		}
	}
	};

	ourLevels.slowdrop.introText = 
	"This should be nice and easy, rookie, a chance to get a feel for the lander\'s controls. All you need to do is fly right over the landing zone and wait.";
//	ourLevels.moonbaseAlpha.introText = "";
//	ourLevels.moonbaseBeta.introText = "";
	
	game.level = [
		ourLevels.cavern,
		ourLevels.trench,
		ourLevels.slowdrop,
		ourLevels.moonbaseAlpha,
		ourLevels.moonbaseBeta,
	];

	splitIntoLines = function(originalText,maxLineLength){
		maxLineLength = maxLineLength || 50;		
		var words = originalText.split(' ');
		var result = [""];
		
		var line = 0;
		do {
			result[line] += words[0] + ' ';
			words.shift();
			if (result[line].length > maxLineLength && words.length) {
				line++;
				result.push("");
			}
		} while (words.length);
		
		return result;
	};
	
	for (var i=0; i<game.level.length; i++ ) {
		if (game.level[i].introText) {game.level[i].introTextArray = splitIntoLines(game.level[i].introText);}
	};

	return game;
};