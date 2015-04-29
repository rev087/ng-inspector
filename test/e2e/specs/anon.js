describe('anonymous app', function() {
	
	var angularVersion = browser.params.angularVersion;

	beforeEach(function () {
		browser.get('anon/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	var ROOT_ELEMENT = 'div.angular-root-element';

	it('should inspect the anonymous app', function() {
		expect($$('.ngi-app').count()).toBe(1);
		expect($('.ngi-app > label').getText()).toBe(ROOT_ELEMENT + '.ng-scope');
	});

	it('should inspect the root scope', function() {
		expect($$('.ngi-scope').count()).toBe(1);
		expect($('.ngi-scope .ngi-annotation-builtin').getText()).toBe('$rootScope');
	});

});