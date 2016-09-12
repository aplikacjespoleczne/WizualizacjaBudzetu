"use strict"

var gulp = require('gulp');

//Util tools
var sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean');


//Tools
var jshint = require('gulp-jshint'),
    sass = require('gulp-sass');



/* ============ Tasks ================*/

/*
Images tasks
*/
gulp.task('images', ['images:copy']);

gulp.task("images:copy", ['images:clean'], function () {
  var imagesPath = "./frontend_src/img/**/*.*";

  return gulp.src(imagesPath)
  .pipe(gulp.dest("./public/images/"));
});

gulp.task("images:clean", function () {
  var path = "./public/images/";

  return gulp.src(path , {read: false})
  .pipe(clean());
});

/*
Sass tasks
*/
gulp.task("sass", function() {
  var mainPath = './frontend_src/sass/main.sass',
      outputPath = './public/stylesheets/',

      sassOptions = {
        errLogToConsole: true,
        outputStyle: 'expanded'
      },

      renameOpts = {
        basename: "styles"
      };

  return gulp.src(mainPath)
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['last 20 versions']}))
        .pipe(rename(renameOpts))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest(outputPath));
});


/*
Javascript tasks
*/
gulp.task('javascript', ['javascript:after']);

gulp.task('javascript:concat', ['javascript:delete'], function() {
  var scriptsPath = './frontend_src/scripts/**/*.js',
      libJSPath = './frontend_src/lib/js/**/*.js',
      outputPath = './public/javascripts/';

  gulp.src([libJSPath, scriptsPath])
      .pipe(sourcemaps.init())
      .pipe(concat('scripts.js'))
      .pipe(sourcemaps.write('../maps'))
      .pipe(gulp.dest(outputPath));
});

gulp.task('javascript:delete', function() {
  var path = "./public/javascripts/";

  return gulp.src(path , {read: false})
    .pipe(clean());
});

gulp.task('javascript:after', ['jshint']);

gulp.task('jshint',['javascript:concat'] ,function() {
  gulp.src('./frontend_src/scripts/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});


/*
Watch task
*/
gulp.task('watch', ['javascript'], function() {
  gulp.watch('./frontend_src/sass/**/*.sass', ['sass']);
  gulp.watch('./frontend_src/scripts/**/*.js', ['javascript']);
  gulp.watch('./frontend_src/img/**/*.*', ['images']);
})

gulp.task('default',
          [
            'images',
            'sass',
            'javascript',
            'watch'
          ]
);
