/* This module returns livereload module if app is in live-reload mode - else it returns empty object
    You can configure paths to be watched in config.watchDir and extension in config.exts
*/
var livereload = require('livereload');
var reloadFunction = undefined;

// Checking command-line arguments - if live-reload is the third argument, then return livereload functionality
if (process.argv[2] === "live-reload") {
  var currentDir = process.cwd();

  var config = {
    exts: ['jade'],
    watchDir: [ currentDir + '/views',  currentDir + '/public']
  };

  reloadFunction = function(app) {
    return expressLivereload(app, config);
  }
}

/* This function is the exact copy of express-livereload npm package, but uses the livereload module 0.5, so it works with multiple paths */
function expressLivereload (app, config) {
  var server;
  if (config == null) {
    config = {};
  }
  if (app.settings.env === 'production') {
    return app.locals.LRScript = "";
  } else {
    app.locals.LRScript = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':" + (config.port || 35729) + "/livereload.js\"></' + 'script>')</script>";
    server = livereload.createServer(config);
    return server.watch(config.watchDir || process.cwd() + "/public");
  }
}

module.exports = reloadFunction;
