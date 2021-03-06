var express = require('express');
var app = express();
var server = require('http').Server(app);

var port = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('dist'));
app.use('/assets', express.static('./assets'));

app.set('views', './src/views');
app.set('view engine', 'ejs');

var games = [
	{title: 'Moon Lander', bundle:'lander',},
	{title: 'Blob Raiders', bundle:'spaceShooter', scoresFileName: 'scores_blobraiders.json'},
	{title: 'Platform Demo', bundle:'platform'},
	{title: 'Asteroid Epic', bundle:'spacegame', scoresFileName: 'scores_spaceGame.json'}
];

var scores = require('./server/getScoresFromFiles')(games);
// console.log('scores',scores)

app.get('/', function(req,res) {
	res.render('standard', {title: 'Home Page', gameList:games});
});

games.forEach(game => {
	app.get('/'+game.bundle, function(req,res){
		res.render('gameView', game);
	});
});

var scoreRouter = require('./server/routes/scoreRouter')(games, scores);
app.use('/scores',scoreRouter);


server.listen(port);
console.log('running server on port '+ port);

