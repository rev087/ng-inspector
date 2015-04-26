describe('anonymous app', function() {

	beforeEach(function () {
		browser.get('/anon.html');
		element(by.id('ngInspectorToggle')).click();
	});

	it('should inspect the anonymous app', function() {
		expect($$('.ngi-app').count()).toBe(1);
		expect($('.ngi-app > label').getText()).toBe('body.ng-scope');
	});

	it('should inspect the root scope', function() {
		expect($$('.ngi-scope').count()).toBe(1);
		expect($('.ngi-scope .ngi-annotation-builtin').getText()).toBe('$rootScope');
	});

});