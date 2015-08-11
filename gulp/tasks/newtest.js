var gulp = require('gulp');
var replace = require('gulp-replace');
var argv = require('yargs').argv;
var format = require('util').format;
var config = require('../config');

gulp.task('newtest', function() {
    var testName = argv.name;
    if (!testName) throw new Error('Test name required. Use --name');

    gulp.src([format('%s/boilerplate-test/**', config.e2eDir)])
        .pipe(replace(/!TEST_NAME!/, testName))
        .pipe(gulp.dest(format('%s/tests/%s', config.e2eDir, testName)));
});
