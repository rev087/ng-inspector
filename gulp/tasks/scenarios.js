var gulp = require('gulp');
var format = require('util').format;
var config = require('../config');
var scenarioServer = require('../../test/e2e/scenario-server');

gulp.task('scenarios', function() {
	scenarioServer(3000);
});
