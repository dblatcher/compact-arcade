const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    lander:'./src/ep-lander.js',
    platform:'./src/ep-platform.js',
    spacegame:'./src/ep-spacegame.js',
    spaceShooter:'./src/ep-spaceshooter.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};