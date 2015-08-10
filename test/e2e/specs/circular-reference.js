var preparePage = require('../helpers/preparePage')('circular-reference');

describe('detect circular references', function() {

	beforeEach(preparePage);

	it('should detect a circular reference', function() {
		expect($$('.ngi-model.ngi-model-circular').count()).toBe(1);
	});

});
