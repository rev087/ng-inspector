/* global NGI */
/* jshint strict: false */
/* jshint boss: true */

NGI.Scope = (function() {

	function Scope(app, ngScope, isIsolate) {

		var angular = window.angular;

		this.app = app;
		this.ngScope = ngScope;

		// Calculate the scope depth in the tree to determine the intendation level
		// in the TreeView
		var depth = 0;
		var reference = ngScope;
		while (reference = reference.$parent) { depth++; }

		// Instantiate and expose the TreeViewItem representing the scope
		var view = this.view = NGI.TreeView.scopeItem(ngScope.$id, depth, isIsolate);
		if (isIsolate) this.view.element.classList.add('ngi-isolate-scope');

		// Called when the `NGI.InspectorAgent` DOM traversal finds a Node match
		// for the scope
		this.setNode = function(node) {
			this.node = this.view.node = node;
		};

		// Keturns the keys for the user defined models in the scope, excluding
		// keys created by AngularJS or the `this` keyword
		function modelKeys() {
			var keys = [];
			for (var key in ngScope) {
				if (ngScope.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
					keys.push(key);
				}
			}
			return keys;
		}

		// Returns an object representing the keys and values of the user defined
		// models in the scope
		function models() {
			var obj = {}, keys = modelKeys();
			for (var i = 0; i < keys.length; i++) {
				obj[keys[i]] = ngScope[keys[i]];
			}
			return obj;
		}

		function childScopeIds() {
			if (!ngScope.$$childHead) return [];
			var childKeys = [];
			var childScope = ngScope.$$childHead;
			do {
				childKeys.push(childScope.$id);
			} while (childScope = childScope.$$nextSibling);
			return childKeys;
		}

		var scopeModel = this;
		function updateModels(models) {
			view.removeChildren('ngi-model');
			var keys = Object.keys(models);
			for (var i = keys.length - 1; i >= 0; i--) {
				var model = NGI.Model.instance(keys[i], models[keys[i]], depth+1);
				scopeModel.view.addChild(model.view, true);
			}
		}

		var oldChildIds = childScopeIds();
		var oldModels = models();
		updateModels(oldModels);

		var destroyDeregister = angular.noop;
		var watchDeregister = angular.noop;
		var observerOn = false;

		this.startObserver = function() {
			if (observerOn === false) {
				destroyDeregister = ngScope.$on('$destroy', function() {
					view.destroy();
				});
				watchDeregister = ngScope.$watch(function() {

					// Scopes: basic check for mutations in the direct child scope list
					var newChildIds = childScopeIds();
					if (!angular.equals(oldChildIds, newChildIds)) {
						NGI.InspectorAgent.inspectScope(app, ngScope);
					}
					oldChildIds = newChildIds;

					// Models
					var newModels = models();
					if (!angular.equals(oldModels, newModels)) {
						updateModels(newModels);
					}
					oldModels = newModels;
				});
				observerOn = true;
			}
		};

		this.stopObserver = function() {
			if (observerOn === true) {
				if (typeof destroyDeregister === 'function') {
					destroyDeregister.apply();
				}
				if (typeof watchDeregister === 'function') {
					watchDeregister.apply();
				}
				observerOn = false;
			}
		};

	}

	// To easily retrieve an `NGI.Scope` instance by the scope id, we keep a
	// cache of created instances
	var scopeCache = {};

	// Expose stopObservers to stop observers from all scopes in `scopeCache` when
	// the inspector pane is toggled off
	Scope.stopObservers = function() {
		for (var i = 0; i < scopeCache.length; i++) {
			scopeCache[i].stopObserver();
		}
	};

	// Returns an instance of `NGI.Scope` representing the AngularJS scope with
	// the id
	Scope.get = function(id) {
		return scopeCache[id];
	};

	// This is the method used by `NGI.InspectorAgent` to instantiate the
	// `NGI.Scope` object
	Scope.instance = function(app, ngScope, isIsolate) {
		if (scopeCache[ngScope.$id]) {
			return scopeCache[ngScope.$id];
		}
		var scope = new NGI.Scope(app, ngScope, isIsolate);
		scopeCache[ngScope.$id] = scope;
		return scope;
	};

	return Scope;

})();