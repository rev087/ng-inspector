browser.ignoreSynchronization = true;
var $$ = function(query) { return element.all(by.css(query)); }
var $ = function(query) { return element(by.css(query)); }

describe('dependency', function() {

  beforeEach(function () {
		browser.get('/dependency.html');
		element(by.id('ngInspectorToggle')).click();
		browser.sleep(250);
  });

	it('should inspect the directive in a dependency', function() {
		expect($$('.ngi-scope').count()).toBe(2);
		expect($$('.ngi-scope .ngi-annotation-dir').count()).toBe(1);
		expect($('.ngi-scope .ngi-annotation-dir').getText()).toBe('sayHi');
	});

});