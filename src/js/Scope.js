var NGI = {
	TreeView: require('./TreeView'),
	ModelMixin: require('./ModelMixin'),
	InspectorAgent: require('./InspectorAgent'),
	Model: require('./Model')
};

function Scope(app, ngScope, isIsolate) {

	var angular = window.angular;

	this.app = app;
	this.ngScope = ngScope;
	this.ngiType = 'Scope';

	// Calculate the scope depth in the tree to determine the indentation level
	// in the TreeView
	var reference = ngScope;
	var depth = [reference];
	while (reference = reference.$parent) { depth.push(reference); }

	// Instantiate and expose the TreeViewItem representing the scope
	var view = this.view = NGI.TreeView.scopeItem(ngScope.$id, depth, isIsolate);
	if (isIsolate) this.view.element.classList.add('ngi-isolate-scope');

	// Called when the `NGI.InspectorAgent` DOM traversal finds a Node match
	// for the scope
	this.setNode = function(node) {
		this.node = this.view.node = node;
	};

	function childScopeIds() {
		if (!ngScope.$$childHead) return [];
		var childKeys = [];
		var childScope = ngScope.$$childHead;
		do {
			childKeys.push(childScope.$id);
		} while (childScope = childScope.$$nextSibling);
		return childKeys;
	}

	var oldChildIds = childScopeIds();

	var destroyDeregister = angular.noop;
	var watchDeregister = angular.noop;
	var observerOn = false;

	NGI.ModelMixin.extend(this);
	this.update(ngScope, depth, NGI.Model);

	this.startObserver = function() {
		if (observerOn === false) {
			var scopeObj = this;
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
				scopeObj.update(ngScope, depth, NGI.Model);

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
	var scope = new Scope(app, ngScope, isIsolate);
	scopeCache[ngScope.$id] = scope;
	return scope;
};

module.exports = Scope;
