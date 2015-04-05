browser.ignoreSynchronization = true;
var $$ = function(query) { return element.all(by.css(query)); }
var $ = function(query) { return element(by.css(query)); }

describe('empty directive', function() {

	var _warn, _warnMessage;

  beforeEach(function () {
		browser.get('/empty-directive.html');
		element(by.id('ngInspectorToggle')).click();
		browser.sleep(250);
  });

	it('should warn about empty directive declarations', function() {
		expect($('#warning').getText())
			.toMatch(/Make sure all registered directives return a "Directive Definition Object"/);
	});

});