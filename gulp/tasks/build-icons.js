var gulp = require('gulp');

gulp.task('build:icons', function() {
	return gulp.src(['src/icons/*.png'])
		.pipe(gulp.dest('ng-inspector.safariextension/icons/'))
		.pipe(gulp.dest('ng-inspector.chrome/icons/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/icons/'));
});