var gulp = require('gulp');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
var config = require('../config');
var format = require('util').format;

gulp.task('build:js', function() {
	return gulp.src([format('%s/*.js', config.jsDir)])
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("(function(window) {\n\"use strict\";\n\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest(format('%s/', config.safariDir)))
		.pipe(gulp.dest(format('%s/', config.chromeDir)))
		.pipe(gulp.dest(format('%s/data/', config.firefoxDir)))
		.pipe(gulp.dest(format('%s/scenarios/lib/', config.e2eDir)));
});