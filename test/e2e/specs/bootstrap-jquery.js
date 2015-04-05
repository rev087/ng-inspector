browser.ignoreSynchronization = true;
var $$ = function(query) { return element.all(by.css(query)); }
var $ = function(query) { return element(by.css(query)); }

describe('bootstrap with a jquery object', function() {

  beforeEach(function () {
		browser.get('/bootstrap-jquery.html');
		element(by.id('ngInspectorToggle')).click();
		browser.sleep(250);
  });

	it('should inspect the directive in a dependency', function() {
		expect($('.ngi-inspector .ngi-value').getText()).toBe('"John Doe"');
	});

});