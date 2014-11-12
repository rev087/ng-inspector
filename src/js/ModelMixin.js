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

	ModelMixin.update = function(values, depth) {

		if (typeof this.modelObjs === 'undefined') this.modelObjs = {};
		if (typeof this.modelKeys === 'undefined') this.modelKeys = [];

		var newKeys = getKeys(values),
				diff = arrayDiff(this.modelKeys, newKeys),
				i, key;

		// Removed keys
		for (i = 0; i < diff.removed.length; i++) {
			var key = diff.removed[i];
			this.modelObjs[key].view.destroy();
			delete this.modelObjs[key];
		}
		
		// New keys
		for (i = 0; i < diff.added.length; i++) {
			key = diff.added[i];
			this.modelObjs[key] = NGI.Model.instance(key, values[key], depth.concat([values]));
			var insertAtTop = this instanceof NGI.Scope;
			this.view.addChild(this.modelObjs[key].view, insertAtTop);
		}

		// Updated keys
		for (i = 0; i < diff.existing.length; i++) {
			key = diff.existing[i];
			if (!this.modelObjs[key]) {
				var inst = this instanceof NGI.Scope ? 'Scope' : this instanceof NGI.Model ? 'Model' : 'UNKNOWN INSTANCE';
				continue;
			}
			this.modelObjs[key].setValue(values[key]);
		}

		this.modelKeys = newKeys;
	};

	ModelMixin.extend = function(obj) {
		obj.update = ModelMixin.update.bind(obj);
	};

	return ModelMixin;

})();
