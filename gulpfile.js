var gulp = require('gulp');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
// var jshint = require('gulp-jshint');
var semver = require('semver');
var fs = require('fs');
var colors = require('colors');
var plist = require('plist');
var spawn = require('child_process').spawn;

function run(cmd, args, callback) {
	var child = spawn(cmd, args);
	var buffer = '';
	child.stdout.on('data', function (data) { buffer = buffer + data; });
	child.stderr.on('data', function (data) { console.error(data.toString()); });
	child.on('close', function(code) {
		if (code !== 0) throw cmd + ' process exited with code ' + code;
		else callback.apply(this, [buffer]);
	});
}

function bump(release) {

	// Check if the stage is clean
	run('git', ['diff', '--staged'], function(res) {
		if (res.length > 0) {
			return console.error('\n ' + ' BUMP ERROR '.redBG.bold.black +
				' Cannot update manifests with a dirty Git stage. \n'.red);
		}

		// Bump the version in package.json
		var pkg = require('./package.json');
		var old = pkg.version;
		pkg.version = 'v' + semver.inc(pkg.version, release);
		var jsonStr = JSON.stringify(pkg, null, 2);
		fs.writeFileSync('package.json', jsonStr);

		// Bump the version in Info.plist
		var info = plist.parseFileSync('ng-inspector.safariextension/Info.plist');
		info.CFBundleShortVersionString = pkg.version;
		info.CFBundleVersion = pkg.version;
		var plistStr = plist.build(info).toString();
		fs.writeFileSync('ng-inspector.safariextension/Info.plist', plistStr);

		// Git add
		run('git', ['add', 'package.json', 'ng-inspector.safariextension/Info.plist'], function() {

			// Git commit
			var commitMsg = 'Prepare for ' + pkg.version;
			run('git', ['commit', '-m', commitMsg], function() {

				// Git tag
				run('git', ['tag', pkg.version], function() {

					// Print a virtual congratulatory pat on the back
					var msg = ('\n "' + pkg.name + '"').cyan.bold +
					' bumped from ' + old.green.underline + ' to ' +
					pkg.version.magenta.underline + '\n';
					console.log(msg);

				}); // tag

			}); // commit

		}); // add

	}); // check stage
}

gulp.task('bump:major', function() { bump('major'); });
gulp.task('bump:minor', function() { bump('minor'); });
gulp.task('bump:patch', function() { bump('patch'); });

gulp.task('build', function() {

	// Concatenate the /src/*.js files to ng-inspector.js
	return gulp.src([
		'src/Inspector.js',
		'src/InspectorAgent.js',
		'src/InspectorPane.js',
		'src/TreeView.js',
		'src/Service.js',
		'src/App.js',
		'src/Module.js',
		'src/Scope.js',
		'src/bootstrap.js'
	])
		// .pipe(jshint())
		// .pipe(jshint.reporter('default'))
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("\"use strict\";\n(function(window) {\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest('ng-inspector.safariextension/'));

	// Here would be a good place to build the archive. But it requires a custom
	// build of the `xar` executable to extract certificates from a Safari-built
	// .safariextz, then signing the .xar archive (renamed .safariextz).

	// Steps to build from the command line:
	// http://developer.streak.com/2013/01/how-to-build-safari-extension-using.html

});

gulp.task('watch', function() {
	gulp.watch('src/*.js', ['build']);
});


gulp.task('default', ['build']);