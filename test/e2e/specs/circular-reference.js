describe('detect circular references', function() {

	var angularVersion = browser.params.angularVersion;

	beforeEach(function () {
		browser.get('circular-reference/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	it('should detect a circular reference', function() {
		expect($$('.ngi-model.ngi-model-circular').count()).toBe(1);
	});

});