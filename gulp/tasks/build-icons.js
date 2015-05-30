var gulp = require('gulp');
var config = require('../config');
var format = require('util').format;

gulp.task('build:icons', function() {
	return gulp.src([format('%s/*.png', config.iconsDir)])
		.pipe(gulp.dest(format('%s/icons/', config.safariDir)))
		.pipe(gulp.dest(format('%s/icons/', config.chromeDir)))
		.pipe(gulp.dest(format('%s/data/icons/', config.firefoxDir)));
});