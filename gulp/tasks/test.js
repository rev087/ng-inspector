var gulp = require('gulp');
var format = require('util').format;
var config = require('../config');
var scenarioServer = require(format('../../%s/scenarios/scenario-server', config.e2eDir));
var protractor = require('gulp-angular-protractor');

gulp.task('test', function(cb) {
	var server = scenarioServer(3000);

	gulp.src([format('%s/specs/*.js', config.e2eDir)])
		.pipe(protractor({
		    'configFile': format('%s/protractor.conf.js', config.testDir),
		    'autoStartStopServer': true
		}))
		.on('error', function(e) { throw e })
		.on('end', function() {
			server.close();
			cb();
		});
});