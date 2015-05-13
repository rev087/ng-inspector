var gulp = require('gulp');
var less = require('gulp-less');
var replace = require('gulp-replace');

gulp.task('build:css', function() {
	return gulp.src(['src/less/stylesheet.less'])
		.pipe(less())
		.pipe(gulp.dest('ng-inspector.safariextension/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/'))
		.pipe(replace(/url\(/g, 'url(chrome-extension://__MSG_@@extension_id__/')) // Add path prefix for Chrome
		.pipe(gulp.dest('ng-inspector.chrome/'))
		.pipe(replace(/(\s*)(.+url\(.+)/g, '$1/* $2 */$1background-image: none !important;')) // Remove images from the test build
		.pipe(gulp.dest('test/e2e/scenarios/lib/'));
});