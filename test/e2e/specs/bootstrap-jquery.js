describe('bootstrap with a jquery object', function() {
	
	var angularVersion = browser.params.angularVersion;

	beforeEach(function () {
		browser.get('bootstrap-jquery/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	it('should inspect the directive in a dependency', function() {
		expect($('.ngi-inspector .ngi-value').getText()).toBe('"John Doe"');
	});

});