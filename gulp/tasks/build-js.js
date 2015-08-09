var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var format = require('util').format;
var config = require('../config');

gulp.task('build:js', function () {
  var b = browserify({
    entries: config.browserifyEntry,
    debug: true
  });

  return b.bundle()
    .pipe(source(config.jsOutputName))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(gulp.dest(format('%s/', config.safariDir)))
    .pipe(gulp.dest(format('%s/', config.chromeDir)))
    .pipe(gulp.dest(format('%s/data/', config.firefoxDir)))
    .pipe(gulp.dest(format('%s/lib/', config.e2eDir)));
});