var gulp = require('gulp');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');

gulp.task('build', function() {

	// Concatenate the /src/*.js files to ng-inspector.js
	return gulp.src('src/*.js')
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("(function(window) {\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest('ng-inspector.safariextension/'));

	// Here would be a good place to build the archive. But it requires a custom
	// build of the `xar` executable to extract certificates from a Safari-built
	// .safariextz, then signing the .xar archive (renamed .safariextz).

	// Steps to build from the command line:
	// http://developer.streak.com/2013/01/how-to-build-safari-extension-using.html

});

gulp.task('default', ['build']);