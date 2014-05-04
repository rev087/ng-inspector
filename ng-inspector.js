(function() {

	var mergeArray = function() {
		var merged = [];
		for (var a = 0; a < arguments.length; a++) {
			var arr = arguments[a];
			for (var i = 0; i < arr.length; i++) {
				if (merged.indexOf(arr[i]) < 0) merged.push(arr[i]);
			}
		}
		return merged;
	};

	var arrayInclude = function(arr, el) {
		if (arr.indexOf(el) < 0) arr.push(el);
	}

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

	var ScopeItem = function(scope, appItem, parentScopeItem, depth) {
		
		if ( typeof depth === 'undefined' || isNaN(depth) )
			depth = 0;

		this.scope = scope;
		this.appItem = appItem;
		this.parentScopeItem = parentScopeItem;
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

		// Find the DOM Node
		////////////////////

		this.node = null;
		this.isIsolate = null;
		this.findDOMNode = function(el) {

			$el = angular.element(el);

			// Check for a match in the element isolate scope
			if ('isolateScope' in $el) {
				var $isolateScope = $el.isolateScope();
				if ($isolateScope && $isolateScope.$id === this.scope.$id) {
					this.node = el;
					this.isIsolate = true;
					return true;
				}
			}

			// Check for a match in the element scope
			if ('scope' in $el) {
				var $scope = $el.scope();
				if ($scope && $scope.$id === this.scope.$id) {
					this.node = el;
					this.isIsolate = false;
					return true;
				}
			}

			// No match, look deeper
			var children = el.querySelectorAll('.ng-scope, .ng-isolate-scope');
			for (var i = 0; i < children.length; i++) {
				var match = this.findDOMNode(children[i]);
				if (match) return true;
			}

			return false;
		};
		if (this.parentScopeItem && this.parentScopeItem.node)
			this.findDOMNode(this.parentScopeItem.node);
		else
			this.findDOMNode(this.appItem.node);

		if (!this.node && this.appItem.inspector.showWarnings) {
			console.warn('ng-inspector: No DOM node found for scope ' + this.scope.$id);
		}

		if (this.isIsolate) this.element.classList.add('ngi-isolate-scope');

		// Association labels
		/////////////////////

		this.assocLabels = [];
		this.addAssociation = function(text, isBuiltIn) {
			if (this.assocLabels.indexOf(text) < 0) {
				this.assocLabels.push(text);
			} else {
				return;
			}
			var span = document.createElement('span');
			span.className = 'ngi-assoc';
			span.innerText = text;
			if (isBuiltIn) span.classList.add('ngi-minor-assoc');
			this.label.appendChild(span);
		};

		var assoc = this.appItem.associations;

		// Controllers
		for ( var i = 0; i < assoc.controllers.length; i++) {
			var name = assoc.controllers[i];
			if (this.node && this.node.getAttribute('ng-controller') === name) {
				this.addAssociation(name);
			}
		}

		// Directives, restrict: A
		for ( var i = 0; i < assoc.directives.A.length; i++) {
			var desc = assoc.directives.A[i];
			if (this.node && this.node.hasAttribute(desc.dasherized) &&
				this.isIsolate === desc.isIsolate) {
				this.addAssociation(desc.name, desc.isBuiltIn);
			}
		}
		// Directives, restrict: E
		for ( var i = 0; i < assoc.directives.E.length; i++) {
			var desc = assoc.directives.E[i];
			if (this.node &&
				this.node.tagName.toLowerCase() === desc.dasherized.toLowerCase() &&
				this.isIsolate === desc.isIsolate) {
				this.addAssociation(desc.name, desc.isBuiltIn);
			}
		}

		// Label ng-repeat items
		if (this.node && this.node.hasAttribute('ng-repeat')) {
			this.addAssociation('ngRepeat', true);
		}

		// Label ng-include scopes
		if (this.node && this.node.hasAttribute('ng-include')) {
			this.addAssociation('ngInclude', true);
		}

		// Label ng-if scopes
		if (this.node && this.node.hasAttribute('ng-if')) {
			this.addAssociation('ngIf', true);
		}

		// Label root scopes
		if (this.scope.$root.$id === this.scope.$id) {
			this.addAssociation('$rootScope', true);
		}

		// Label ng-transclude scopes
		if (this.node && this.node.parentNode && this.node.parentNode.hasAttribute &&
			this.node.parentNode.hasAttribute('ng-transclude')) {
			this.addAssociation('ngTransclude', true);
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
				var childItem = new ScopeItem(childScope, this.appItem, this, this.depth + 1);
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

		// console.log the DOM element the scope is attached to
		this.label.addEventListener('click', function(event) {
			// scopeItem.drawer.classList.toggle('ngi-collapsed'); // toggle drawer
			console.log(scopeItem.node);
		}, true);

		// Check for changes in every digest cycle
		this.oldModels = this.getModels();
		this.oldChildScopes = this.getChildScopes();
		this.watcherDestructor = this.scope.$watch(function() {

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
						var childItem = new ScopeItem(newChildScopes[i], scopeItem.appItem, scopeItem, scopeItem.depth + 1);
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
			this.watcherDestructor();
			this.element.parentNode.removeChild(this.element);
		}

		return this;
	}

	var AppItem = function(node, inspector) {

		this.node = node;
		this.inspector = inspector;
		this.scope = angular.element(node).scope();

		// Find the module
		this.module = null;
		this.name = null;
		if (node.getAttribute('ng-app')) {
			this.name = node.getAttribute('ng-app');
			this.module = angular.module(this.name);
		} else {
			this.name = 'ng-app';
		}

		this.element = document.createElement('div');
		this.element.className = 'ngi-app';
		this.element.innerHTML = '<label>' + this.name + '</label>';

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		// Recursively get all the required modules
		var traversed = [];
		var getRequires = function(moduleName) {
			
			if (traversed.indexOf(moduleName) < 0) {
				traversed.push(moduleName);
			} else {
				return [];
			}

			var mod = angular.module(moduleName);
			for (var n = 0; n < mod.requires.length; n++) {
				if (requires.indexOf(moduleName) < 0)
					arrayInclude(requires, mod.requires[n]);
				requires = mergeArray(requires, getRequires(mod.requires[n]));
			}
			arrayInclude(requires, moduleName);
			return requires;
		}

		var requires = ['ng'];
		if (this.module) {
			requires = mergeArray(requires, getRequires(this.module.name));
		}
		if (this.inspector.showWarnings) {
			console.info('ng-inspector: Inspecting AngularJS modules:', requires);
		}

		// Hold on to your seat belts...
		var injector = angular.element(this.node).injector();

		// Utility to retrieve directive instances. Used to learn the restrict
		// and scope settings.
		var DIRECTIVE_CACHE = [];
		this.getDirective = function(module, invoker) {
			var name = invoker[2][0];

			if (!(module.name in DIRECTIVE_CACHE))
				DIRECTIVE_CACHE[module.name] = [];

			if (name in DIRECTIVE_CACHE)
				return DIRECTIVE_CACHE[module.name][name];

			var fn = angular.isArray(invoker[2][1]) ?
				invoker[2][1][invoker[2][1].length-1] : invoker[2][1];

			var dir = null;
			try {
				dir = injector.invoke(fn);
			} catch (err) {
				// We couldn't invoke, so let's coercing that restrict out of the
				// stubborn directive
				var match = {
					restrict: /restrict\s*:\s*['"]([EACM]+)['"]/.exec(fn),
					isIsolate: /scope\s*:\s*{/.test(fn),
					isChild: /scope\s*:\s*(true)/i.test(fn)
				}
				if (match.restrict && match.restrict.length > 1) {
					dir = {
						restrict: match.restrict[1],
						scope: match.isIsolate ? {} : (match.isChild ? true : null)
					}
				}
				else {
					// No luck this way either, fall back to the defaults
					if (this.inspector.showWarnings) {	
						console.warn('ng-inspector: Could not inspect directive ' + name + ' from ' + module.name);
					}
					dir = {restrict: 'A', scope: null}
				}
			}

			// If the directive uses the simple link function syntaxe, it won't return
			// an object. In this case, we assume the defaults.
			if (angular.isFunction(dir)) dir = {restrict: 'A', scope: null};

			// Cache and return
			return DIRECTIVE_CACHE[module.name][name] = dir;
		}

		// Retrieve all the available directives and controllers
		this.associations = {
			controllers: [],
			directives: {
				A: [],
				E: [],
				C: [],
				M: []
			}
		};
		if (this.module) {

			for (var f = 0; f < requires.length; f++) {
				var mod = angular.module(requires[f]);
				for (var n = 0; n < mod._invokeQueue.length; n++) {
					var invoke = mod._invokeQueue[n];
					var provider = invoke[0];
					var name = invoke[2][0];

					//deb
					switch (provider) {
						case '$controllerProvider':
							this.associations.controllers.push(name);
							break;
						case '$compileProvider':

							// Can't handle this, move on
							if (!angular.isString(name)) { continue; }

							var dasherized = name.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase(),
								dir = this.getDirective(mod, invoke),
								desc = {
									name: name,
									dasherized: dasherized,
									isIsolate: angular.isObject(dir.scope),
									isBuiltIn: [
											'ng', 'ngRoute', 'ngAnimate', 'ngResource',
											'ngCookies', 'ngTouch', 'ngSanitize', 'ngMock',
										].indexOf(mod.name) > -1
								};
							
							// restrict: 'A' (default)
							if (!dir.restrict || (angular.isString(dir.restrict) && dir.restrict.indexOf('A') > -1)) {
								this.associations.directives.A.push(desc);
							}

							// restrict: 'E'
							if (angular.isString(dir.restrict) && dir.restrict.indexOf('E') > -1) {
								this.associations.directives.E.push(desc);
							}

							// restrict: 'C'
							if (angular.isString(dir.restrict) && dir.restrict.indexOf('C') > -1) {
								this.associations.directives.C.push(desc);
							}

							// restrict: 'M'
							if (angular.isString(dir.restrict) && dir.restrict.indexOf('M') > -1) {
								this.associations.directives.M.push(desc);
							}

							break;
					}
				}
			}
			// console.log(JSON.stringify(this.associations));
		};

		// Set the root scope item
		$scope = angular.element(this.node).scope().$root;
		this.rootScopeItem = new ScopeItem($scope, this);
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
			if (this.showWarnings) console.time('ng-inspector');
			this.element.classList.add('ngi-processing');

			// Retrieve the ng-app elements from the DOM
			var that = this;
			requestAnimationFrame(function() {
				var els = document.querySelectorAll('[ng-app]');
				for ( var i = 0; i < els.length; i++ ) {
					var app = new AppItem(els.item(i), that);
					that.apps.push(app);
					that.drawer.appendChild(app.element);
				}
				that.element.classList.remove('ngi-processing');
				if (that.showWarnings) console.timeEnd('ng-inspector');
			});

		};

		this.toggle = function(settings) {
			if (angular.isObject(settings) && 'showWarnings' in settings) {
				this.showWarnings = settings.showWarnings;
			} else {
				this.showWarnings = false;
			}

			if ( this.element.parentNode ) {
				this.destroy();
				document.body.removeChild(this.element);
			} else {
				document.body.appendChild(this.element);
				this.process();
			}

		};

		// Capture the mouse wheel while hovering the inspector
		this.element.addEventListener('mousewheel', function(event) {
			if ((event.wheelDeltaY > 0 && inspector.scrollTop === 0) ||
				(event.wheelDeltaY < 0 && (
					inspector.element.scrollTop + inspector.element.offsetHeight) === inspector.element.scrollHeight
				)) {
				event.preventDefault();
			}
		});

		this.destroy = function() {
			while (this.apps.length > 0) {
				var app = this.apps.pop();
				app.destroy();
			}
		};

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
		if (angular.isObject(e.data) && e.data.command === 'ngi-toggle') {
			inspector.toggle(e.data.settings);
		}

	}, false);

})();