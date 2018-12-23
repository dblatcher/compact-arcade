# Compact Arcade
JavaScript system for building arcade-style games that render on to a canvas element. The core features of the game like receiving user input, rendering the screen, keeping score, loosing lives and progressing through levels are built in, so the developer can focus on defining the items that populate the game world, and how they behave and interact.
The core concept is using the 'createGame' function to return a 'gameInstance' object to encapsulate all a game's internal logic. The createGame function's argument are and 'options' object and array of 'disk' functions which each add content to default blank gameInstance. Developers can write their own disks to create new games. The disk system is modular to allow code splitting and re-use.
The "in game" objects (known as 'items') like the player character, monsters, obstacles, platforms, exploding barrels (whatever you want in your game!) are generated from methods of the gameInstance which use an object inheritance pattern (avoiding Classes and prototypes) for maximum flexibility to re-use code - you can write a method for returning a 'monster' object and branch off it to create 'bats' and 'dragons' using the same template. 
## Current features
* 2x working example demos : a sample platform game and side scrolling shooter
* user input : keyboard only 
* support for sound files
* customizable backgrounds, title screens and level start screens
* built in support for circular or rectangular items and collision detections
## How to load a Game
Write a HTML page with a canvas element, height and width set to 1000 (most browsers support canvas elements, but you'll need to include a polyfill to make it work for older browsers). Give it an ID so you find it in the dom. You can use whatever styling on the canvas fits the look and layout of your page, but you'll want to keep it square. Add the script tags to include script files containing the createGame function and all the scripts files containing the disk functions you need.

    <! doctype html>
	<html>    
	    <head></head>
	    <body>
		  <canvas id='gameSpace' height='1000' width='1000'/>
		  <script src = './gameTemplate.js' ></script>
		  <script src = './myDisk1.js' ></script>
		  <script src = './myDisk2.js' ></script>
	    </body>
	</html>

Note the file names used for the disk scripts are just examples - don't look for those files on the repo. The next example assumes they each contained disk functions called 'myDisk1' and 'myDisk2'.
If this game used any sound or image files, you'd need to save those files in the same folder as the HTML file (by default - the path can be changed by setting the spritePath and soundPath options).
Add code to call the createGame function with an array containing the disk functions as the first argument. We'll assume this game will use the default options, so we don't need the options object as the second argument. This will return a gameInstance object. Call the gameInstance's initialise method - it takes an options object as its only argument. Setting the object's 'canvasElement' property to  your canvas element as the first argument will make the game run in that element.

    var gameInstance = createGame([myDisk1, myDisk2]);
    gameInstance.initialise({
	  canvasElement: document.getElementById("gameSpace"),
    });
Note that with the example above, the gameInstance object remains accessible in the browser's console, which handy for testing and debugging, but does make it easy for players to cheat! (try gameInstance.session.lives=100). You can prevent this by calling initialise on an anonymous gameInstance:

    createGame([myDisk1, myDisk2]).initialise({
	  canvasElement: document.getElementById("gameSpace"),
    });
## Writing your own games
You can write your own games by defining disk functions and using them when calling createGame. I haven't written documentation on this yet. If interested, please take a look at the disks for the sample games post any questions on the repo.
At a high level, the essential tasks for a disk (or set of disks) to do to make a functioning game are:
* add the methods for creating items to the gameInstance's 'make' object (this is the biggest job - items are the core of the game)
* write the gameInstance's reactToControls method to set what the user's input does
* populate the gameInstance's 'level' array - each member is an object describing a level of the game; what items arein it, its size, what condition has to be true for the level to be won etc.

	    
