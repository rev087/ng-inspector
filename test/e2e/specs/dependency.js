describe('dependency', function() {

	var angularVersion = browser.params.angularVersion;

	beforeEach(function () {
		browser.get('dependency/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	it('should inspect the directive in a dependency', function() {
		expect($$('.ngi-scope').count()).toBe(2);
		expect($$('.ngi-scope .ngi-annotation-dir').count()).toBe(1);
		expect($('.ngi-scope .ngi-annotation-dir').getText()).toBe('sayHi');
	});

});