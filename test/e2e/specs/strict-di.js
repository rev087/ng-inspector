browser.ignoreSynchronization = true;
var $$ = function(query) { return element.all(by.css(query)); }
var $ = function(query) { return element(by.css(query)); }

describe('strict di', function() {

  beforeEach(function () {
		browser.get('/strict-di.html');
		element(by.id('ngInspectorToggle')).click();
		browser.sleep(250);
  });

	it('should not throw an error when unannotated directive is used', function() {
		browser.manage().logs().get('browser').then(function (browserLog) {
			var severeWarnings = browserLog.filter(function(log) {
				return log.level.name === 'SEVERE';
			});

			if (!severeWarnings.length) return;

			severeWarnings.map(function(log) {
				expect(log.message).toNotMatch(/strictdi/);
			});
		});
	});

});