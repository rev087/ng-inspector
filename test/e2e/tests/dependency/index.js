var preparePage = require('../../helpers/preparePage')('dependency');

describe('dependency', function() {

	beforeEach(preparePage);

	it('should inspect the directive in a dependency', function() {
		expect($$('.ngi-scope').count()).toBe(2);
		expect($$('.ngi-scope .ngi-annotation-dir').count()).toBe(1);
		expect($('.ngi-scope .ngi-annotation-dir').getText()).toBe('sayHi');
	});

});
