var gulp = require('gulp');
var connect = require('gulp-connect');
var livereload = require('gulp-livereload');

gulp.task('server', function() {

	var livereloadServer = livereload();
	connect.server();

	gulp.watch(
		[
			'*.html',
			'javascripts/*.js',
			'stylesheets/*.css',
			'images/*.png'
		], function(file) {
			livereloadServer.changed(file.path);
		}
	);

});

gulp.task('default', ['server']);