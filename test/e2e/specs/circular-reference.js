describe('detect circular references', function() {

	beforeEach(function () {
		browser.get('/circular-reference.html');
		element(by.id('ngInspectorToggle')).click();
	});

	it('should detect a circular reference', function() {
		expect($$('.ngi-model.ngi-model-circular').count()).toBe(1);
	});

});