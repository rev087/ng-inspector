var path = require('path');
var express = require('express');
var colors = require('colors');

function scenarioServer(port) {
	var app = express();

	app.set('views', __dirname);
	app.engine('.html', require('ejs').__express);
	app.set('view engine', 'html');
	app.use(express.static(path.join(__dirname, '../')));

	app.get('/app/:scenario/:angularVersion', function (req, res) {
	  res.render('base-template', {
	  	angularVersion: req.params.angularVersion,
	  	scenario: req.params.scenario,
	  	scenarioPath: '../' + req.params.scenario + '.html'
	  });
	});

	return app.listen(3000, function () {
	  var port = this.address().port;
	  console.log('Serving scenarios on port %s'.green, port);
	});
};

var isRequired = !(require.main === module);
if (!isRequired) scenarioServer();

module.exports = scenarioServer;