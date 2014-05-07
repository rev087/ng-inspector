var ModelItem = function(scope, key, depth) {

	this.scope = scope;
	this.key = key;
	this.depth = depth;

	this.element = document.createElement('div');
	this.element.className = 'ngi-model';

	this.label = document.createElement('label');
	this.label.className = 'ngi-depth-' + depth;
	this.element.appendChild(this.label);
	
	this.process = function() {

		// Reset the className
		this.element.className = 'ngi-model';

		// Clear the root DOM node
		while (this.label.lastChild)
			this.label.removeChild(this.label.lastChild);

		var lengthIndicator = function(length) {
			var span = document.createElement('span');
			span.className = 'ngi-length';
			span.innerText = length;
			return span;
		}

		var value = document.createElement('span');
		value.className = 'ngi-value';

		if (angular.isString(scope[key])) {
			this.element.classList.add('ngi-model-string');
			if (scope[key].trim().length > 25) {
				value.innerText = '"' + scope[key].trim().substr(0, 25) + ' (...)"';
				value.appendChild(lengthIndicator(scope[key].length));
			}
			else {
				value.innerText = '"' + scope[key].trim() + '"';
			}
		}
		else if (angular.isFunction(scope[key])) {
			this.element.classList.add('ngi-model-function');
			var args = angular.injector().annotate(scope[key]).join(', ');
			value.innerText = 'function(' + args + ') {...}';
		}
		else if (angular.isArray(scope[key])) {
			this.element.classList.add('ngi-model-array');
			var length = scope[key].length;
			if (length === 0) {
				value.innerText = '[]';
			}
			else {
				value.innerText = '[...]';
				value.appendChild(lengthIndicator(length));
			}
			
		}
		else if (angular.isObject(scope[key])) {
			this.element.classList.add('ngi-model-object');
			var length = Object.keys(scope[key]).length;
			if (length === 0) {
				value.innerText = '{}';
			}
			else {
				value.innerText = '{...}';
				value.appendChild(lengthIndicator(length));
			}
		}
		else if (typeof scope[key] === 'boolean') {
			this.element.classList.add('ngi-model-boolean');
			value.innerText = scope[key];
		}
		else if (angular.isNumber(scope[key])) {
			this.element.classList.add('ngi-model-number');
			value.innerText = scope[key];
		}
		else if (angular.isElement(scope[key])) {
			this.element.classList.add('ngi-model-element');
			value.innerText = '<' + scope[key].tagName + '>';
		}
		else if (scope[key] === null) {
			this.element.classList.add('ngi-model-null');
			value.innerText = 'null';
		}
		else{
			this.element.classList.add('ngi-model-undefined');
			value.innerText = 'undefined';
		}

		var b = document.createElement('b');
		b.innerText = key + ':';
		this.label.appendChild(b);

		this.label.appendChild(document.createTextNode(' '));
		this.label.appendChild(value);
	}

	this.process();

	this.log = function(event) {
		if (console && 'log' in console)
			console.log(scope[key]);
	};

	this.label.addEventListener('click', this.log);

	this.destroy = function() {
		this.element.parentNode.removeChild(this.element);
	}

	return this;
}