/* global NGI */
/* jshint strict: false */
/* jshint boss: true */

NGI.Scope = (function() {

	function Scope(node, ngScope, isIsolate) {
		// Calculate the scope depth in the tree to determine the intendation level
		// in the TreeView
		var depth = -1;
		var reference = ngScope;
		do { depth++; } while (reference = reference.$parent);

		// Instantiate and expose the TreeViewItem representing the scope
		this.view = NGI.TreeView.scopeItem(ngScope.$id, node, depth, isIsolate);

		// Destroy the TreeViewItem when the AngularJS scope is destroyed
		ngScope.$on('$destroy', function() {
			NGI.TreeView.flushNode(node);
		});

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
		function getModels() {
			var models = {}, keys = modelKeys();
			for (var i = 0; i < keys.length; i++) {
				models[keys[i]] = ngScope[keys[i]];
			}
			return models;
		}

		ngScope.$watch(function() {

		});

	}

	// To easily retrieve an `NGI.Scope` instance by the scope id, we keep a
	// cache of created instances
	var scopeCache = {};

	// Returns an instance of `NGI.Scope` representing the AngularJS scope with
	// the id
	Scope.get = function(id, kind, node) {
		if (!scopeCache[id]) {
			console.warn(kind, id, 'not found in the scope cache. Should be the parent of', id, node);
			throw 'STAHP! CANT FIND SCOPE ' + id + '!';
		}
		return scopeCache[id];
	};

	// This is the method used by `NGI.InspectorAgent` to instantiate the
	// `NGI.Scope` object
	Scope.instance = function(node, ngScope, isIsolate) {
		if (scopeCache[ngScope.$id]) {
			return scopeCache[ngScope.$id];
		}
		var scope = new NGI.Scope(node, ngScope, isIsolate);
		scopeCache[ngScope.$id] = scope;
		return scope;
	};

	return Scope;

})();