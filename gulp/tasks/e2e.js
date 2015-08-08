var gulp = require('gulp');
var path = require('path');
var config = require('../config');
var format = require('util').format;
var child_process = require('child_process');
var scenarioServer = require('../../test/e2e/scenarios/scenario-server');

// Protractor execution adapted from: https://github.com/mllrsohn/gulp-protractor

function getProtractorBinary() {
    var winExt = /^win/.test(process.platform) ? '.cmd' : '';
    var pkgPath = require.resolve('protractor');
    var protractorDir = path.resolve(path.join(path.dirname(pkgPath), '..', 'bin'));
    return path.join(protractorDir, '/protractor' + winExt);
}

function getProtractorConfPath() {
    return format('%s/protractor.conf.js', config.e2eDir);
}

gulp.task('e2e', function(done) {
    var server = scenarioServer(3000);
    var argv = process.argv.slice(3);
    var protractorArgs = [].concat.apply(getProtractorConfPath(), argv);

    var finishTask = function(exitCode) {
        var gulpExitVal = exitCode ? 'Tests Failed' : null;
        server.close(done.bind(this, gulpExitVal));
    };

    child_process.spawn(getProtractorBinary(), protractorArgs, {
        stdio: 'inherit'
    }).once('close', finishTask);
});
