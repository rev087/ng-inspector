// Tested with AngularJS v1.2.16
(function() {

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
				value.innerText = '"' + scope[key] + '"';
			}
			else if (angular.isFunction(scope[key])) {
				this.element.classList.add('ngi-model-function');
				var args = angular.injector().annotate(scope[key]).join(', ');
				value.innerText = 'function(' + args + ') {…}';
			}
			else if (angular.isArray(scope[key])) {
				this.element.classList.add('ngi-model-array');
				var length = scope[key].length;
				if (length === 0) {
					value.innerText = '[]';
				}
				else {
					value.innerText = '[…]';
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
					value.innerText = '{…}';
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

	var ScopeItem = function(scope, depth) {
		
		if ( typeof depth === 'undefined' || isNaN(depth) )
			depth = 0;

		this.scope = scope;
		this.depth = depth;

		this.element = document.createElement('div');
		this.element.className = 'ngi-scope';

		this.label = document.createElement('label');
		this.label.className = 'ngi-depth-' + depth;
		this.label.innerText = this.scope.$id;
		this.element.appendChild(this.label);

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		// Find this scope's DOM element
		this.node = null;
		var ngScopes = document.querySelectorAll('.ng-scope');
		for ( var i = 0; i < ngScopes.length; i++ ) {
			if (angular.element(ngScopes.item(i)).scope() === scope) {
				this.node = ngScopes.item(i);
				break;
			}
		}

		// Models
		/////////

		this.models = [];

		this.addModel = function(key) {
			var model = new ModelItem(this.scope, key, this.depth + 1);
			this.models.push(model);
			this.drawer.appendChild(model.element);
		};

		this.getModelKeys = function() {
			var models = [];
			for (key in this.scope) {
				if (this.scope.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
					models.push(key);
				}
			}
			return models;
		};

		this.processModels = function() {
			var keys = this.getModelKeys();
			for (var i = 0; i < keys.length; i++) this.addModel(keys[i])
		};
		this.processModels();

		this.getModels = function() {
			var models = {}, keys = this.getModelKeys();
			for (var i = 0; i < keys.length; i++) {
				models[keys[i]] = this.scope[keys[i]];
			}
			return models;
		}

		this.updateModels = function() {
			for (var i = 0; i < this.models.length; i++) {
				this.models[i].process();
			}
		}

		// Child scopes
		///////////////

		this.processChildScopes = function() {

			// No children? Nothing to see here citizen, move along.
			if ( !this.scope.$$childHead ) return;

			var childScope = this.scope.$$childHead;

			do {
				var childItem = new ScopeItem(childScope, this.depth + 1);
				this.drawer.appendChild(childItem.element);
			} while (childScope = childScope.$$nextSibling);
		};
		this.processChildScopes();

		this.getChildScopes = function() {
			if (!this.scope.$$childHead) return [];
			var childScopes = [];
			var childScope = this.scope.$$childHead;
			do {
				childScopes.push(childScope);
			} while (childScope = childScope.$$nextSibling);
			return childScopes;
		}

		// Events
		/////////

		var scopeItem = this;

		this.scope.$on('$destroy', function() {
			scopeItem.destroy();
		})

		// Highlight DOM elements the scope is attached to when hovering the item
		// in the inspector
		this.label.addEventListener('mouseover', function() {
			if ( scopeItem.node )
				scopeItem.node.classList.add('ngi-highlight');
		});
		this.label.addEventListener('mouseout', function() {
			if ( scopeItem.node )
				scopeItem.node.classList.remove('ngi-highlight');
		});

		// Check for changes in every digest cycle
		this.oldModels = this.getModels();
		this.oldChildScopes = this.getChildScopes();
		this.scope.$watch(function() {

			// Models
			var newModels = scopeItem.getModels();
			if (!angular.equals(scopeItem.oldModels, newModels)) {
				scopeItem.updateModels();
			}
			scopeItem.oldModels = newModels;

			// Child scopes
			var newChildScopes = scopeItem.getChildScopes();
			if (!angular.equals(scopeItem.oldChildScopes, newChildScopes)) {

				// Removals are handled by the scopes, since angular emits a
				// $destroy event.
				for (var i = 0; i < newChildScopes.length; i++) {
					var added = scopeItem.oldChildScopes.indexOf(newChildScopes[i]) < 0;
					if ( added ) {
						var childItem = new ScopeItem(newChildScopes[i], scopeItem.depth + 1);
						scopeItem.drawer.appendChild(childItem.element);
					}
				}
			}
			scopeItem.oldChildScopes = newChildScopes;
		});

		// Destructor
		/////////////

		this.destroy = function() {
			while (this.models.length > 0) {
				var m = this.models.pop();
				m.destroy();
			}
			this.element.parentNode.removeChild(this.element);
		}

		return this;
	}

	var AppItem = function(node, inspector) {

		this.node = node;
		this.name = node.getAttribute('ng-app') ?
			node.getAttribute('ng-app') : 'ng-app';
		this.scope = angular.element(node).scope();

		this.element = document.createElement('div');
		this.element.className = 'ngi-app';
		this.element.innerHTML = '<label>' + this.name + '</label>';

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		// Set the root scope
		$scope = angular.element(this.node).scope();
		this.rootScopeItem = new ScopeItem($scope);
		this.drawer.appendChild(this.rootScopeItem.element);

		this.destroy = function() {
			this.element.parentNode.removeChild(this.element);
		};
		
		return this;
	}

	var Inspector = function() {

		// Create the inspector view
		this.element = document.createElement('div');
		this.element.className = 'ngi-inspector';
		this.element.innerHTML = '';

		// Create the root node for the ng-app items
		this.drawer = document.createElement('div');
		this.drawer.className = 'app-list';
		this.element.appendChild(this.drawer);

		this.apps = [];

		this.process = function() {
			
			// Clear the drawer
			while (this.apps.length > 0) {
				var app = this.apps.pop();
				app.destroy();
			}

			// Retrieve the ng-app elements from the DOM
			var els = document.querySelectorAll('[ng-app]');
			for ( var i = 0; i < els.length; i++ ) {
				var app = new AppItem(els.item(i), this);
				this.apps.push(app);
				this.drawer.appendChild(app.element);
			}
		};

		this.toggle = function() {
			if ( this.element.parentNode ) {
				document.body.removeChild(this.element);
			} else {
				this.process();
				document.body.appendChild(this.element);
			}
		};

		// Collapsing scopes
		this.element.addEventListener('click', function(event) {
			var parent = event.target.parentElement;
			if (parent.classList.contains('ngi-scope')) {
				var drawer = parent.querySelector('.ngi-drawer');
				drawer.classList.toggle('ngi-collapsed');
			}
		}, true);

		// Capture the mouse wheel while hovering the inspector
		this.element.addEventListener('mousewheel', function(event) {
			if ((event.wheelDeltaY > 0 && inspector.scrollTop === 0)
				|| (event.wheelDeltaY < 0 && (
					inspector.element.scrollTop + inspector.element.offsetHeight) === inspector.element.scrollHeight
				)) {
				event.preventDefault();
			}
		});

		return this;
	}

	var inspector = null;

	window.onload = function() {
		// Instantiate the inspector
		inspector = new Inspector();
	};

	window.addEventListener('message', function (e) {

		// Make sure the message was sent by this tab
		if (e.origin !== window.location.origin) return;

		// Fail if the inspector has not been initialized yet
		if ( !inspector ) {
			console.error('The ng-inspector has not yet initialized');
			return;
		}

		// Filter toggle events
		if (e.data == 'ngi-toggle') inspector.toggle();

	}, false);

})();