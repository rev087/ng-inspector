describe('empty directive', function() {

	var angularVersion = browser.params.angularVersion;
	var _warn, _warnMessage;

	beforeEach(function () {
		browser.get('empty-directive/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	it('should not throw exception when directive with empty DDO is used', function() {
		browser.manage().logs().get('browser').then(function (browserLog) {
			var severeWarnings = browserLog.filter(function(log) {
				// Not concerned about info or warnings
				return log.level.name === 'SEVERE';
			});

			severeWarnings.forEach(function(warning) {
				// https://github.com/rev087/ng-inspector/issues/39
				expect(warning.message).toNotMatch(/Cannot read property 'restrict' of undefined/i);
			});
		});
	});

});