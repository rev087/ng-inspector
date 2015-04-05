browser.ignoreSynchronization = true;
var $$ = function(query) { return element.all(by.css(query)); }
var $ = function(query) { return element(by.css(query)); }

describe('detect circular references', function() {

	beforeEach(function () {
		browser.get('/circular-reference.html');
		element(by.id('ngInspectorToggle')).click();
		browser.sleep(250);
	});

	it('should detect a circular reference', function() {
		expect($$('.ngi-model.ngi-model-circular').count()).toBe(1);
	});

});