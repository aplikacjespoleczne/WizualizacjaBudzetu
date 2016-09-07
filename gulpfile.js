var gulp = require('gulp');

//Util tools
var sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat');

//Tools
var jshint = require('gulp-jshint'),
    sass = require('gulp-sass');


//Tasks
gulp.task('jshint', function() {
  gulp.src('./frontend_src/scripts/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task("images", function () {
  gulp.src("./frontend_src/img/*")
    .pipe(gulp.dest("./public/images/"));
});

gulp.task("sass", function() {
  var mainPath = './frontend_src/sass/main.scss',
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
        .pipe(autoprefixer())
        .pipe(rename(renameOpts))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest(outputPath));
});

gulp.task('javascript', function() {
  var scriptsPath = './frontend_src/scripts/**/*.js',
      libJSPath = './frontend_src/lib/js/**/*.js',
      outputPath = './public/javascripts/';

  gulp.src([libJSPath, scriptsPath])
      .pipe(sourcemaps.init())
      .pipe(concat('scripts.js'))
      .pipe(sourcemaps.write('../maps'))
      .pipe(gulp.dest(outputPath));
});

// Watch task
gulp.task('watch', function() {
  gulp.watch('./frontend_src/sass/**/*.scss', ['sass']);
  gulp.watch('./frontend_src/scripts/**/*.js', ['javascript']);
})

gulp.task('default', ['images','sass','jshint','javascript','watch']);
