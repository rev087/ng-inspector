var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');

gulp.task('concat', function() {
	return gulp.src('src/*.js')
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("(function(window) {\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest('build/ng-inspector.safariextension/'));
});

gulp.task('clean', function() {
	return gulp.src('build/**/*.*', {read:false})
		.pipe(clean({force:true}));
});

gulp.task('build', ['clean', 'concat'], function() {

	// Source
	gulp.src([
		'global.html',
		'Info.plist',
		'inject-end.js',
		'ng.png',
		'Settings.plist',
		'stylesheet.css'
		])
		.pipe(gulp.dest('build/ng-inspector.safariextension/'));

	// Icons
	gulp.src('icons/*.png')
		.pipe(gulp.dest('build/ng-inspector.safariextension/icons'));


	// Build the archive


});

gulp.task('default', ['concat']);