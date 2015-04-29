var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var replace = require('gulp-replace');
var wrap = require('gulp-wrap');
var semver = require('semver');
var fs = require('fs');
var colors = require('colors');
var plist = require('plist');
var spawn = require('child_process').spawn;
var angularProtractor = require('gulp-angular-protractor');
var webserver = require('gulp-webserver');
var scenarioServer = require('./test/e2e/scenarios/scenario-server');

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
		var info = plist.parseFileSync('ng-inspector.safariextension/Info.plist');
		info.CFBundleShortVersionString = pkg.version;
		info.CFBundleVersion = pkg.version;
		var plistStr = plist.build(info).toString();
		fs.writeFileSync('ng-inspector.safariextension/Info.plist', plistStr);

		// Bump the version in manifest.json
		var manifest = require('./ng-inspector.chrome/manifest.json');
		manifest.version = semver.inc(manifest.version, release);
		var manifestStr = JSON.stringify(manifest, null, 2);
		fs.writeFileSync('./ng-inspector.chrome/manifest.json', manifestStr);

		// Bump the version in manifest.json
		var fxpackage = require('./ng-inspector.firefox/package.json');
		fxpackage.version = semver.inc(fxpackage.version, release);
		var fxPackageStr = JSON.stringify(fxpackage, null, 2);
		fs.writeFileSync('./ng-inspector.firefox/package.json', manifestStr);

		// Git add
		run('git', ['add', 'package.json', 'ng-inspector.safariextension/Info.plist', 'ng-inspector.chrome/manifest.json', 'ng-inspector/package.json'], function() {

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

gulp.task('build:icons', function() {
	return gulp.src(['src/icons/*.png'])
		.pipe(gulp.dest('ng-inspector.safariextension/icons/'))
		.pipe(gulp.dest('ng-inspector.chrome/icons/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/icons/'));
});

gulp.task('build:js', function() {
	return gulp.src([
		'src/js/Inspector.js',
		'src/js/InspectorAgent.js',
		'src/js/InspectorPane.js',
		'src/js/TreeView.js',
		'src/js/Highlighter.js',
		'src/js/Utils.js',
		'src/js/Service.js',
		'src/js/App.js',
		'src/js/Module.js',
		'src/js/ModelMixin.js',
		'src/js/Scope.js',
		'src/js/Model.js',
		'src/js/bootstrap.js'
	])
		.pipe(concat('ng-inspector.js', {newLine:"\n\n"}))
		.pipe(wrap("(function(window) {\n\"use strict\";\n\n<%= contents %>\n})(window);"), {variable:'data'})
		.pipe(gulp.dest('ng-inspector.safariextension/'))
		.pipe(gulp.dest('ng-inspector.chrome/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/'))
		.pipe(gulp.dest('test/e2e/scenarios/lib/'));
});

gulp.task('build:css', function() {
	return gulp.src(['src/less/stylesheet.less'])
		.pipe(less())
		.pipe(gulp.dest('ng-inspector.safariextension/'))
		.pipe(gulp.dest('ng-inspector.firefox/data/'))
		.pipe(replace(/url\(/g, 'url(chrome-extension://__MSG_@@extension_id__/')) // Add path prefix for Chrome
		.pipe(gulp.dest('ng-inspector.chrome/'))
		.pipe(replace(/(\s*)(.+url\(.+)/g, '$1/* $2 */$1background-image: none !important;')) // Remove images from the test build
		.pipe(gulp.dest('test/e2e/scenarios/lib/'));
});

gulp.task('test', function(cb) {
	var server = scenarioServer(3000);

	gulp.src(['test/e2e/specs/*.js'])
		.pipe(angularProtractor({
		    'configFile': 'test/protractor.conf.js',
		    'autoStartStopServer': true
		}))
		.on('error', function(e) { throw e })
		.on('end', function() {
			server.close();
			cb();
		});
});

// Here would be a good place to build the Safari archive. But it requires a
// custom build of the `xar` executable to extract certificates from a
// Safari-built .safariextz, then signing the .xar archive (renamed .safariextz)

// Steps to build from the command line:
// http://developer.streak.com/2013/01/how-to-build-safari-extension-using.html

gulp.task('watch', function() {
	gulp.watch('src/icons/*.png', ['build:icons']);
	gulp.watch('src/js/*.js', ['build:js']);
	gulp.watch('src/less/*.less', ['build:css']);
});

gulp.task('default', ['build:icons', 'build:js', 'build:css']);
