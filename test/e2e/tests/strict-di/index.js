var preparePage = require('../../helpers/preparePage')('strict-di');

describe('strict di', function() {

	beforeEach(preparePage);

	it('should not throw an error when unannotated directive is used', function() {
		browser.manage().logs().get('browser').then(function (browserLog) {
			var severeWarnings = browserLog.filter(function(log) {
				return log.level.name === 'SEVERE';
			});

			if (!severeWarnings.length) return;

			severeWarnings.forEach(function(log) {
				expect(log.message).toNotMatch(/strictdi/);
			});
		});
	});

});