var AppItem = function(node) {

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
	if (ngInspector.showWarnings) {
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
				if (ngInspector.showWarnings) {	
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