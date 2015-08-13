var path = require('path');
var fs = require('fs');
var util = require('util');
var express = require('express');
var colors = require('colors');
var versionConfig = require('../angular-versions.conf');

function getTestNames() {
	var testDirPath = path.join(__dirname, '../tests');
	// Sync because this is only used for basic debugging in development
	return fs.readdirSync(testDirPath).filter(function(file) {
		return fs.statSync(require('path').resolve(testDirPath, file)).isDirectory();
	});
}

function getLibPath(angularVersion) {
	return versionConfig.versions[angularVersion].path;
}

function scenarioServer(port) {
	var app = express();

	app.set('views', __dirname);
	app.engine('.html', require('ejs').__express);
	app.set('view engine', 'html');
	app.use(express.static(path.join(__dirname, '..')));

	app.get('/', function(req, res) {
		var defaultVersion = Object.keys(versionConfig.versions)[0];
		res.render('directory', {
			angularVersions: versionConfig.versions,
			testNames: getTestNames(),
			angularVersion: req.query.version || defaultVersion
		});
	});

	app.get('/app/:scenario/:angularVersion', function(req, res) {
		var params = req.params;
		res.render('../tests/base-template', {
			angularVersion: params.angularVersion,
			angularLibPath: getLibPath(params.angularVersion),
			scenario: req.params.scenario,
			scenarioPath: '../tests/' + params.scenario + '/index.html'
		});
	});

	return app.listen(port, function() {
		var port = this.address().port;
		console.log('Serving scenarios on port %s'.green, port);
	});
};

var isRequired = !(require.main === module);
if (!isRequired) scenarioServer();

module.exports = scenarioServer;
