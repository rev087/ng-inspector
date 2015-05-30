var format = require('util').format;

var testDir = 'test';

module.exports = {
	lessDir: 'src/less',
	safariDir: 'ng-inspector.safariextension',
	firefoxDir: 'ng-inspector.firefox',
	chromeDir: 'ng-inspector.chrome',
	iconsDir: 'src/icons',
	jsDir: 'src/js',
	testDir: testDir,
	e2eDir: format('%s/e2e', testDir)
};