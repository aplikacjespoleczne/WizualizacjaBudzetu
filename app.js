var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var debug = require('debug')('WizualizacjaBudzetu');
var serverStatic = require('serve-static');
var routes = require('./routes/index');
var liveReload = require('./utils/livereload');

var app = express();

//Adding the livereload server if app is in live-reload mode
if (liveReload) {
  liveReload(app);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + './uploads'));
app.use(serverStatic("public"));

//@author jmachlan, KDP
app.use(multer({
  dest: './uploads/',
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase();
  },
  onFileUploadStart: function (file) {
    process.stderr.write('Uploading file..........');
  },
  onFileUploadComplete: function (file) {
    process.stderr.write('done\n');
  },
  onError: function (error, next) {
    process.stderr.write('ERROR durign UPLOAD: ' + error);
    next(error);
    }
}));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Probably not needed as app is started from here
//module.exports = app;


// Moved from bin/www
app.set('port', process.env.PORT || 8080);

var server = app.listen(app.get('port'), function() {
   console.log('Express server listening on port ' + server.address().port);
});
//var server = app.listen(app.get('port'), function() {
//  debug('Express server listening on port ' + server.address().port);
//});
