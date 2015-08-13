var preparePage = require('../../helpers/preparePage')('!TEST_NAME!');

describe('suite name', function() {

    // Navigate to test page and open ng-inspector
    beforeEach(preparePage);

    it('should pass', function() {
        expect(true).toBe(true);
    });

});
