var path = require('path');
var fs = require('fs');
var util = require('util');
var express = require('express');
var colors = require('colors');

function scenarioServer(port) {
	var app = express();

	app.set('views', __dirname);
	app.engine('.html', require('ejs').__express);
	app.set('view engine', 'html');
	app.use(express.static(path.join(__dirname, '..')));

	// If accessing the root route, render a list of scenarios
	var HTML_EXTENSION = /\.html$/;
	app.get('/:angularVersion?', function(req, res) {
		var version = req.params.angularVersion || '1.3.0';
		var title= util.format('Scenarios (using Angular %s)', version);
		var scenarios = [];
		fs.readdir(path.join(__dirname, '..'), function(err, files) {
			for (var i=0; i<files.length; i++) {
				var filepath = path.join(__dirname, '..', files[i]);
				var stat = fs.statSync(filepath);
				if (stat.isFile() && files[i].match(HTML_EXTENSION)) {
					var scenario = files[i].replace(HTML_EXTENSION, '');
					scenarios.push(util.format('<li><a href="/app/%s/%s">%s</a></li>', scenario, version, scenario));
				}
			}
			res.send(util.format('<h1>%s</h1> <ul>%s</ul>', title, scenarios.join("\n")));
		});
	});

	app.get('/app/:scenario/:angularVersion', function (req, res) {
	  res.render('../tests/base-template', {
	  	angularVersion: req.params.angularVersion,
	  	scenario: req.params.scenario,
	  	scenarioPath: '../tests/' + req.params.scenario + '/index.html',
	  	// scenarioPath: '../' + req.params.scenario + '.html'
	  });
	});

	return app.listen(port, function () {
	  var port = this.address().port;
	  console.log('Serving scenarios on port %s'.green, port);
	});
};

var isRequired = !(require.main === module);
if (!isRequired) scenarioServer();

module.exports = scenarioServer;
