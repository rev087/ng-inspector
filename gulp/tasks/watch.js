var gulp = require('gulp');
var format = require('util').format;
var config = require('../config');

gulp.task('watch', function() {
	gulp.watch(format('%s/*.png', config.iconsDir), ['build:icons']);
	gulp.watch(format('%s/*.js', config.jsDir), ['build:js']);
	gulp.watch(format('%s/*.less', config.lessDir), ['build:css']);
});