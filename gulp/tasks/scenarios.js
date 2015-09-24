var gulp = require('gulp');
var format = require('util').format;
var config = require('../config');
var scenarioServer = require('../../test/e2e/scenario-server');

// Pass --noEmbed or -n to supress the embeding of ng-inspector to use the
// scenarios with the extension itself.
gulp.task('scenarios', function() {
	scenarioServer(3000);
});
