var gulp = require('gulp');

gulp.task('watch', function() {
	gulp.watch('src/icons/*.png', ['build:icons']);
	gulp.watch('src/js/*.js', ['build:js']);
	gulp.watch('src/less/*.less', ['build:css']);
});