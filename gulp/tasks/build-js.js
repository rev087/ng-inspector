var gulp = require('gulp');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');

gulp.task('build:js', function() {
	return gulp.src([
		'src/js/Inspector.js',
		'src/js/InspectorAgent.js',
		'src/js/InspectorPane.js',
		'src/js/TreeView.js',
		'src/js/Highlighter.js',
		'src/js/Utils.js',
		'src/js/Service.js',
		'src/js/App.js',
		'src/js/Module.js',
		'src/js/ModelMixin.js',
		'src/js/Scope.js',
		'src/js/Model.js',
		'src/js/bootstrap.js'
	])
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("(function(window) {\n\"use strict\";\n\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest('ng-inspector.safariextension/'))
		.pipe(gulp.dest('ng-inspector.chrome/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/'))
		.pipe(gulp.dest('test/e2e/scenarios/lib/'));
});