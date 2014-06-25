/* global NGI */
/* jshint strict: false */

NGI.ModelMixin = (function() {

	// Keturns the keys for the user defined models in the scope excluding keys
	// created by AngularJS or the `this` keyword, or the elements
	// in an array or object
	function getKeys(values) {
		var keys = [];
		for (var key in values) {
			if (values.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
				keys.push(key);
			}
		}
		return keys;
	}

	function arrayDiff(a, b) {
		var i, ret = { added: [], removed: [], existing: [] };

		// Iterate through b checking for added and existing elements
		for (i = 0; i < b.length; i++) {
			if (a.indexOf(b[i]) < 0) {
				ret.added.push(b[i]);
			} else {
				ret.existing.push(b[i]);
			}
		}

		// Iterate through a checking for removed elements
		for (i = 0; i < a.length; i++) {
			if (b.indexOf(a[i]) < 0) {
				ret.removed.push(a[i]);
			}
		}

		return ret;
	}

	function ModelMixin() {}

	ModelMixin.prototype.values = {};
	ModelMixin.prototype.keys = [];

	ModelMixin.prototype.update = function(values, depth) {
		var newKeys = getKeys(values),
				diff = arrayDiff(this.keys, newKeys),
				i, key;

		this.keys = newKeys;
		
		// New keys
		for (i = 0; i < diff.added.length; i++) {
			key = diff.added[i];
			this.values[key] = NGI.Model.instance(key, values[key], depth + 1);
			var insertAtTop = this instanceof NGI.Scope;
			this.view.addChild(this.values[key].view, insertAtTop);
		}

		// Updated keys
		for (i = 0; i < diff.existing.length; i++) {
			key = diff.existing[i];
			this.values[key].setValue(values[key]);
		}

		// Removed keys
		for (i = 0; i < diff.removed.length; i++) {
			var key = diff.removed[i];
			this.values[key].view.destroy();
			delete this.values[key];
		}
	};

	ModelMixin.extend = function(obj) {
		var prop;
		for (prop in ModelMixin.prototype) {
			obj[prop] = ModelMixin.prototype[prop];
		}
	};

	return ModelMixin;

})();