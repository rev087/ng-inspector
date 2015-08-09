var gulp = require('gulp');
var less = require('gulp-less');
var replace = require('gulp-replace');
var format = require('util').format;
var config = require('../config');

gulp.task('build:css', function() {
	return gulp.src([format('%s/stylesheet.less', config.lessDir)])
		.pipe(less())
		.pipe(gulp.dest(format('%s/', config.safariDir)))
		.pipe(gulp.dest(format('%s/data/', config.firefoxDir)))
		.pipe(replace(/url\(/g, 'url(chrome-extension://__MSG_@@extension_id__/')) // Add path prefix for Chrome
		.pipe(gulp.dest(format('%s/', config.chromeDir)))
		.pipe(replace(/(\s*)(.+url\(.+)/g, '$1/* $2 */$1background-image: none !important;')) // Remove images from the test build
		.pipe(gulp.dest(format('%s/lib/', config.e2eDir)));
});