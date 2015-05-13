var gulp = require('gulp');
var spawn = require('child_process').spawn;
var colors = require('colors');
var semver = require('semver');
var plist = require('plist');
var config = require('../config');
var format = require('util').format;

gulp.task('bump:major', function() { bump('major'); });
gulp.task('bump:minor', function() { bump('minor'); });
gulp.task('bump:patch', function() { bump('patch'); });

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
		var pkgStr = JSON.stringify(pkg, null, 2);
		fs.writeFileSync('package.json', pkgStr);

		// Bump the version in Info.plist
		var info = plist.parseFileSync(format('%s/Info.plist', config.safariDir));
		info.CFBundleShortVersionString = pkg.version;
		info.CFBundleVersion = pkg.version;
		var plistStr = plist.build(info).toString();
		fs.writeFileSync(format('%s/Info.plist', config.safariDir), plistStr);

		// Bump the version in manifest.json
		var manifest = require(format('./%s/manifest.json', config.chromeDir));
		manifest.version = semver.inc(manifest.version, release);
		var manifestStr = JSON.stringify(manifest, null, 2);
		fs.writeFileSync(format('./%s/manifest.json', config.chromeDir), manifestStr);

		// Bump the version in manifest.json
		var ffpkg = require(format('./%s/package.json', config.firefox));
		ffpkg.version = semver.inc(fxpackage.version, release);
		var ffpkgString = JSON.stringify(fxpackage, null, 2);
		fs.writeFileSync(format('./%s/package.json', config.firefoxDir), ffpkgString);

		// Git add
		run('git', ['add', 'package.json', format('%s/Info.plist', config.safariDir), format('%s/manifest.json', config.chromeDir), format('%s/package.json', config.firefoxDir)], function() {

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