var preparePage = require('../../helpers/preparePage')('directive-object-declaration');

/**
 * Receives N CSS class names as arguments, and returns a selector in the
 * format:
 * path('ngi-model-object', [ngi-model, 3]);
 * .ngi-scope > .ngi-drawer > .ngi-model-object > .ngi-drawer > .ngi-model:nth-child(3)
 */
function path() {
	var sel = '.ngi-scope > .ngi-drawer ';
	for (var i = 0; i < arguments.length; i++) {
		if (typeof arguments[i] == 'object' && arguments[i].length == 2)
			sel += ' > .' + arguments[i][0] + ':nth-child(' + arguments[i][1] + ')'
		else
			sel += ' > .' + arguments[i];

		if (i < arguments.length - 1)
			sel += ' > .ngi-drawer'
	}
	return sel;
}

function toggle() {
	var sel = path.apply(null, arguments);
	sel += ' > label > .ngi-caret';
	element(by.css(sel)).click();
}

describe('identify directives declared with the object style', function() {

	beforeEach(preparePage);

	it('should expand and collapse object models', function() {
		toggle('ngi-model-object');
		expect($('.ngi-model-string .ngi-value').getText()).toBe('"John Doe"');
	});

});
