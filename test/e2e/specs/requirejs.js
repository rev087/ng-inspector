describe('require.js', function() {

	var angularVersion = browser.params.angularVersion;
	var ROOT_ELEMENT = 'div.angular-root-element';

	beforeEach(function () {
		browser.get('requirejs/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});

	it('should inspect app loaded with require.js', function() {
		expect($('.ngi-app > label').getText()).toBe(ROOT_ELEMENT);
		expect($$('.ngi-scope').count()).toBe(2);
		expect($('.ngi-scope .ngi-annotation-builtin').getText()).toBe('$rootScope');
		expect($('.ngi-scope .ngi-annotation-ctrl').getText()).toBe('DemoCtrl');
		expect($('.ngi-model .ngi-indicator').getText()).toBe('31');
		expect($('#foo').getAttribute('value')).toBe('value initially set by DemoCtrl');
	});

});