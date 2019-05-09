var express = require('express');
var app = express();
var server = require('http').Server(app);

var port = process.env.PORT || 8080;

app.use(express.static('dist'));
app.use('/assets', express.static('./assets'));

app.set('views', './src/views');
app.set('view engine', 'ejs');

var games = [
	{title: 'Moon Lander', bundle:'lander'},
	{title: 'Blob Raiders', bundle:'spaceShooter'},
	{title: 'Platform Demo', bundle:'platform'}
];


app.get('/', function(req,res){
	res.render('standard', {title: 'Home Page', gameList:games});
});

games.forEach(game => {
	app.get('/'+game.bundle, function(req,res){
		res.render('gameView', game);
	});
});


server.listen(port);
console.log('running server on port '+ port);

