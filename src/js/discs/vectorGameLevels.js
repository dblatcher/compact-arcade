export function vectorGameLevels(game, options) {
    var lib = game.library.vectorGame;

    game.level = [
        {name: "space duel", width:1000, height: 1000,
        items: [
            {func:"fancyShip", spec:{x:150,y:600,h:0.0*Math.PI, mass: 25, v:0,radius:20,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}, projectile:'deadlyBullet'}, isPlayer:true},        
            {func:"ship", spec:{x:850,y:600,h:0.2*Math.PI,v:0,radius:30, maxSpeed:20,shield:0.5,thrust:0,color:'green', behaviour:null, momentum:{h:(Math.PI*1), m:0}}},        
            ],
            effects : [],
            addWidgets: [lib.thrustMeter,lib.mapWidget],
            removeWidgets:[],
            environment : {
                gravitationalConstant: 0.01,
                airDensity: 0.0,
                localGravity:0
            },
            victoryCondition : function(){
                var test = function(item){
                    return ((item.type==='ship') && (item.color === 'green'));
                }
                var filtered = game.session.items.filter(test);
                return filtered.length === 0;
            }
        },
        {name: "asteroid belt", width:1000, height:1000,
            items :[
                {func:"fancyShip", spec:{x:150,y:600,h:0.0*Math.PI, mass: 50, v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},        
                {func:'rock', spec:{x:200,y:250,h:0,v:0,radius:90,density:2,color:'blue', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
                {func:"ship", spec:{x:850,y:600,h:0.2*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0.2,color:'purple', behaviour:lib.slowDown_AI,momentum:{h:(Math.PI*1), m:6}}},        
                {func:"ship", spec:{x:650,y:900,h:0.2*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'yellow', behaviour:lib.evadeThreat_AI,momentum:{h:(Math.PI*1), m:0}}}
            ],
            effects : [],
            environment :{
                gravitationalConstant:0.1,
                airDensity: 0,
                localGravity: 0
            },
            victoryCondition : function() {
                return (game.session.items.filter(function(item){return(item.type==='rock')}).length === 0);
            }
        },
        {name: "planet pool", width:1200, height:1200,
            items :[
                {func:"fancyShip", spec:{x:150,y:1100,h:0.0*Math.PI,v:0,radius:20,elasticity:0.5,thrust:0,color:'red',momentum:{h:(Math.PI*1), m:0}}, isPlayer:true},
                {func:'blackHole', spec:{x:500,y:500,h:0,v:0,radius:10, mass:2500, gravityMaxRange:250,color:'purple' }},
            
                {func:'solidRock', spec:{x:200,y:250,h:0,v:0,radius:90, mass:60,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
                {func:'solidRock', spec:{x:200,y:950,h:0,v:0,radius:40, mass:20,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
                {func:'solidRock', spec:{x:700,y:150,h:0,v:0,radius:40, mass:20,color:'gray', momentum:{h:(Math.PI*1.5), m:0} },isPlayer:false},
            
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

    return game;
}