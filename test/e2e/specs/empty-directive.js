describe('empty directive', function() {

	var _warn, _warnMessage;

	beforeEach(function () {
		browser.get('/empty-directive.html');
		element(by.id('ngInspectorToggle')).click();
	});

	it('should not throw exception when directive with DDO is used', function() {
		browser.manage().logs().get('browser').then(function (browserLog) {
			var severeWarnings = browserLog.filter(function(log) {
				// Not concerned about info or warnings
				return log.level.name === 'SEVERE';
			});

			expect(severeWarnings.length).toBe(0);
		});
	});

});