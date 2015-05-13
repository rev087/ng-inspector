var gulp = require('gulp');
var scenarioServer = require('../../test/e2e/scenarios/scenario-server');
var protractor = require('gulp-angular-protractor');

gulp.task('test', function(cb) {
	var server = scenarioServer(3000);

	gulp.src(['test/e2e/specs/*.js'])
		.pipe(protractor({
		    'configFile': 'test/protractor.conf.js',
		    'autoStartStopServer': true
		}))
		.on('error', function(e) { throw e })
		.on('end', function() {
			server.close();
			cb();
		});
});