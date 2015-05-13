var fs = require('fs');
var path = require('path');
var format = require('util').format;

var tasks = fs.readdirSync('./gulp/tasks/').filter(function(file) {
	return path.extname(file) === '.js';
});

tasks.forEach(function(task) {
	require(format('./tasks/%s', task));
});