var gulp = require('gulp');
var scenarioServer = require('../../test/e2e/scenarios/scenario-server');

gulp.task('scenarios', function() {
	scenarioServer(3000);
});