/* global NGI */
/* jshint strict: false */

NGI.Model = (function() {

	function Model(key, value, depth) {

		this.view = NGI.TreeView.modelItem(key, value, depth);

		var valSpan = document.createElement('span');
		valSpan.className = 'ngi-value';

		NGI.ModelMixin.extend(this);

		this.setValue = function(newValue) {

			value = newValue;

			// String
			if (angular.isString(value)) {
				this.view.setType('ngi-model-string');
				if (value.trim().length > 25) {
					valSpan.innerText = '"' + value.trim().substr(0, 25) + ' (...)"';
					this.view.setIndicator(value.length);
				}
				else {
					valSpan.innerText = '"' + value.trim() + '"';
				}
			}

			// Function
			else if (angular.isFunction(value)) {
				this.view.setType('ngi-model-function');
				var args = angular.injector().annotate(value).join(', ');
				valSpan.innerText = 'function(' + args + ') {...}';
			}

			// Array
			else if (angular.isArray(value)) {
				this.view.setType('ngi-model-array');
				var length = value.length;
				if (length === 0) {
					valSpan.innerText = '[]';
				}
				else {
					valSpan.innerText = '[...]';
					this.view.setIndicator(length);
				}
				this.view.makeCollapsible(true, true);
				this.update(value, depth + 1);
			}

			// Object
			else if (angular.isObject(value)) {
				this.view.setType('ngi-model-object');
				var length = Object.keys(value).length;
				if (length === 0) {
					valSpan.innerText = '{}';
				}
				else {
					valSpan.innerText = '{...}';
					this.view.setIndicator(length);
				}
				this.view.makeCollapsible(true, false);
				this.update(value, depth + 1);
			}

			// Boolean
			else if (typeof value === 'boolean') {
				this.view.setType('ngi-model-boolean');
				valSpan.innerText = value;
			}

			// Number
			else if (angular.isNumber(value)) {
				this.view.setType('ngi-model-number');
				valSpan.innerText = value;
			}

			// DOM Element
			else if (angular.isElement(value)) {
				this.view.setType('ngi-model-element');
				valSpan.innerText = '<' + value.tagName + '>';
			}

			// NULL
			else if (value === null) {
				this.view.setType('ngi-model-null');
				valSpan.innerText = 'null';
			}

			// Undefined
			else {
				this.view.setType('ngi-model-undefined');
				valSpan.innerText = 'undefined';
			}

		};
		this.setValue(value);

		this.view.label.appendChild(document.createTextNode(' '));
		this.view.label.appendChild(valSpan);
	}

	Model.instance = function(scope, key, value, depth) {
		return new Model(scope, key, value, depth);
	};

	return Model;

})();