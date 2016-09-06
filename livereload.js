/* This module returns livereload module if app is in live-reload mode - else it returns empty object
    You can configure
*/
var livereload = require('livereload');
var watchDir = require('./watchConfig');
var reloadFunction = undefined;

/* This code is copied from express-livereload npm package, but uses the livereload module 0.5 so it works with multiple paths */
var expressLivereload = function(app, config) {
  var server;
  if (config == null) {
    config = {};
  }
  if (app.settings.env === 'production') {
    return app.locals.LRScript = "";
  } else {
    app.locals.LRScript = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':" + (config.port || 35729) + "/livereload.js\"></' + 'script>')</script>";
    server = livereload.createServer(config);
    console.log("Im here");
    console.log(config.watchDir);
    console.log(server);
    return server.watch(config.watchDir || process.cwd() + "/public");
  }
};


// Checking command-line arguments - if live-reload is the third argument, then return livereload
if (process.argv[2] === "live-reload") {
  var currentDir = process.cwd();
  console.log(watchDir);

  var config = {
    watchDir: watchDir
  };

  reloadFunction = function(app) {
    return expressLivereload(app, config);
  }
}

module.exports = reloadFunction;
