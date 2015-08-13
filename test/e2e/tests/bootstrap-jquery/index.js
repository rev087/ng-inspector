var preparePage = require('../../helpers/preparePage')('bootstrap-jquery');

describe('bootstrap with a jquery object', function() {
	
	beforeEach(preparePage);

	it('should inspect the directive in a dependency', function() {
		expect($('.ngi-inspector .ngi-value').getText()).toBe('"John Doe"');
	});

});
