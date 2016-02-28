var NGI = {
	TreeView: require('./TreeView'),
	ModelMixin: require('./ModelMixin'),
	Utils: require('./Utils')
};

function Model(key, value, depth) {

	this.key = key;
	this.value = value;
	this.ngiType = 'Model';

	//TODO check for memory leaks
	this.view = NGI.TreeView.modelItem(this, depth);

	var valSpan = document.createElement('span');
	valSpan.className = 'ngi-value';

	NGI.ModelMixin.extend(this);

	this.setValue = function(newValue) {

		this.value = value = newValue;

		// String
		if (angular.isString(value)) {
			this.view.setType('ngi-model-string');
			if (value.trim().length > 25) {
				valSpan.textContent = '"' + value.trim().substr(0, 25) + ' (...)"';
				this.view.setIndicator(value.length);
			}
			else {
				valSpan.textContent = '"' + value.trim() + '"';
			}
		}

		// Function
		else if (angular.isFunction(value)) {
			this.view.setType('ngi-model-function');
			var args = NGI.Utils.annotate(value).join(', ');
			valSpan.textContent = 'function(' + args + ') {...}';
		}

		// Circular
		else if (depth.indexOf(value) >= 0) {
			this.view.setType('ngi-model-circular');
			valSpan.textContent = 'circular reference';
		}

		// NULL
		else if (value === null) {
			this.view.setType('ngi-model-null');
			valSpan.textContent = 'null';
		}

		// Array
		else if (angular.isArray(value)) {
			this.view.setType('ngi-model-array');
			var length = value.length;
			if (length === 0) {
				valSpan.textContent = '[ ]';
			}
			else {
				valSpan.textContent = '[...]';
				this.view.setIndicator(length);
			}
			this.view.makeCollapsible(true, true);
			this.update(value, depth.concat([this.value]), Model);
		}

		// DOM Element
		else if (angular.isElement(value)) {
			this.view.setType('ngi-model-element');
			valSpan.textContent = '<' + value.tagName + '>';
		}

		// Object
		else if (angular.isObject(value)) {
			this.view.setType('ngi-model-object');
			var length = Object.keys(value).length;
			if (length === 0) {
				valSpan.textContent = '{ }';
			}
			else {
				valSpan.textContent = '{...}';
				this.view.setIndicator(length);
			}
			this.view.makeCollapsible(true, true);
			this.update(value, depth.concat([this.value]), Model);
		}

		// Boolean
		else if (typeof value === 'boolean') {
			this.view.setType('ngi-model-boolean');
			valSpan.textContent = value;
		}

		// Number
		else if (angular.isNumber(value)) {
			this.view.setType('ngi-model-number');
			valSpan.textContent = value;
		}

		// Undefined
		else {
			this.view.setType('ngi-model-undefined');
			valSpan.textContent = 'undefined';
		}

	};
	this.setValue(value);

	this.view.label.appendChild(document.createTextNode(' '));
	this.view.label.appendChild(valSpan);
}

Model.instance = function(key, value, depth) {
	return new Model(key, value, depth);
};

module.exports = Model;
