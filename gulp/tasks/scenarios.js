var gulp = require('gulp');
var format = require('util').format;
var config = require('../config');
var scenarioServer = require(format('../../%s/scenarios/scenario-server', config.e2eDir));

gulp.task('scenarios', function() {
	scenarioServer(3000);
});
