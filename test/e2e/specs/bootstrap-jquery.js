describe('bootstrap with a jquery object', function() {

	beforeEach(function () {
		browser.get('/bootstrap-jquery.html');
		element(by.id('ngInspectorToggle')).click();
	});

	it('should inspect the directive in a dependency', function() {
		expect($('.ngi-inspector .ngi-value').getText()).toBe('"John Doe"');
	});

});