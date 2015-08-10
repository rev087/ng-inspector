var preparePage = require('../helpers/preparePage')('collapse-expand');

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

function $p() { return $(path.apply(null, arguments)); }

describe('collapse and expand treeview items', function() {

	beforeEach(preparePage);

	it('should expand and collapse object models', function() {
		// The string property should be initially hidden
		expect($p('ngi-model-object', ['ngi-model-string', 1]).isDisplayed()).toBe(false);

		// Click the caret to expand the object
		toggle('ngi-model-object');

		// The string property should now be visible
		expect($p('ngi-model-object', ['ngi-model-string', 1]).isDisplayed()).toBe(true);

		// Click the caret again to collapse the object
		toggle('ngi-model-object');

		// The string property should not be hidden
		expect($p('ngi-model-object', ['ngi-model-string', 1]).isDisplayed()).toBe(false);
	});

	it('should expand and collapse array models', function() {
		// The string property should not be visible
		expect($p('ngi-model-array', ['ngi-model-string', 1]).isDisplayed()).toBe(false);

		// Click the caret to expand the array
		toggle('ngi-model-array');

		// The string property should now be visible
		expect($p('ngi-model-array', ['ngi-model-string', 1]).isDisplayed()).toBe(true);

		// Click the caret again to collapse the array
		toggle('ngi-model-array');

		// The string property should not be visible
		expect($p('ngi-model-array', ['ngi-model-string', 1]).isDisplayed()).toBe(false);
	});

	it('should expand and collapse nested objects and arrays', function() {

		// Array inside Object should be initially hidden
		expect($p('ngi-model-object', ['ngi-model', 3]).isDisplayed()).toBe(false);

		// Click the caret to expand the object
		toggle('ngi-model-object');

		// Array inside Object should now be visible
		expect($p('ngi-model-object', ['ngi-model', 3]).isDisplayed()).toBe(true);

		// Object > Array > child should be hidden
		expect($p('ngi-model-object', ['ngi-model', 3], ['ngi-model', 1]).isDisplayed()).toBe(false);

		// Click the caret on Object > Array to expand it
		toggle('ngi-model-object', ['ngi-model', 3]);

		// Object > Array > child should now be visible
		expect($p('ngi-model-object', ['ngi-model', 3], ['ngi-model', 1]).isDisplayed()).toBe(true);

		// Object > Array > Object > child should be hidden
		expect($p('ngi-model-object', ['ngi-model', 3], ['ngi-model', 1], ['ngi-model', 1]).isDisplayed()).toBe(false);

		// Click the caret on Object > Array > Object to expand it
		toggle('ngi-model-object', ['ngi-model', 3], ['ngi-model', 1]);

		// Object > Array > Object > child should now be visible
		expect($p('ngi-model-object', ['ngi-model', 3], ['ngi-model', 1], ['ngi-model', 1]).isDisplayed()).toBe(true);
	});

});
