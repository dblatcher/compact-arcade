const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    lander:'./src/ep-lander.js',
    spaceShooter:'./src/ep-spaceshooter.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};